import { Suspense, lazy, useEffect, useState } from 'react';
import type { ComponentType, FC } from 'react';

import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';

interface LoaderDefaultOptions {
  delay: number;
  minimumLoading: number;
}

type LoadComponent = () => Promise<{ default: ComponentType<unknown> }>;

type AnyProps = Record<string, unknown>;

function wait(ms: number) {
  return new Promise((response) => {
    setTimeout(response, ms);
  });
}

// a little bit complex staff is going on here
// let me explain it
// usually, we load components asynchronously with `Suspense` and `lazy` by this way
/*
  <Suspense fallback={<Loading />}>
    {lazy(_ => import('path/to/the/component'))}
  </Suspense>
*/

// here we have two major problems:

// 1) When the loading process is finished "quickly", we will see the fallback component
//    has come-and-gone quickly, which will lead to blinking on the page

// The solution of the first problem is a so-called "delayed fallback", which gives us
// an opportunity to not show the fallback component if the loading process
// takes less than a certain amount of time
// So, the implementation of it is here:

function getDelayedFallback(Fallback: FC, delay: number) {
  return function DelayedFallback(props: AnyProps) {
    const [isDelayPassed, setIsDelayPassed] = useState(false);

    useEffect(() => {
      const timerId = setTimeout(() => {
        setIsDelayPassed(true);
      }, delay);

      return () => {
        clearTimeout(timerId);
      };
    }, []);

    return isDelayPassed ? <Fallback {...props} /> : undefined;
  };
}

/* ================================================================================== */

// 2) The second one is the minimum amount of time of fallback render.
//    We said that `DelayedFallback` will not show the fallback component in all cases
//    when the loading process is finished during the `delay` amount of time,
//    but when that process is continuing longer than the `delay`, then the fallback component should
//    be appeared. Okay, now let's consider a situation when the loading process finishes a millisecond
//    after appearing of the fallback component. We will see the fallback component has come-and-gone
//    quickly, which will again lead to blinking on the page.

// The solution of the second problem is to set of a minimum timeout, which will
// ensure that the fallback component will be rendered for that minimum amount of time

const getLazyComponent = (loadComponent: LoadComponent, loaderOptions: LoaderDefaultOptions) =>
  lazy(() => {
    // fix the moment of starting loading
    const start = performance.now();
    // start loading
    return loadComponent().then((moduleExports) => {
      // loading is finished
      const end = performance.now();
      const diff = end - start;

      // first of all, let's remember that we also have `loaderOptions` optionally
      // provided by user, it has `delay` and `minimumLoading`:
      // 1) `delay` - if the loading process is finished during this amount of time
      //    the user will not see the fallback component at all
      // 2) `minimumLoading` - but if it appears, it will stay rendered for at least
      //    this amount of time

      // so, according to above mentioned, there are three conditions we are interested in
      // 1) when `diff` is less than `delay`; in this case, we will immediately return
      //    the result, thereby we will prevent the rendering of the fallback
      //    and the main component will be rendered
      // 2) when `diff` is bigger than `delay` but less than `delay + minimumLoading`;
      //    it means `fallback` component has already been rendering and we have to
      //    wait (starting from this moment) for `delay + minimumLoading - diff`
      //    amount of time
      // 3) when `diff` is bigger than `delay + minimumLoading`. It means we don't need to wait
      //    anymore and we should immediately return the result as we do it in 1) case.

      // so, in the 1) and 3) cases we return the result immediately, and in 2) case we have to wait
      // at least for `delay + minimumLoading - diff` amount of time

      const { delay, minimumLoading } = loaderOptions;

      if (diff < delay || (diff > delay && diff > delay + minimumLoading)) {
        return moduleExports;
      }

      return wait(delay + minimumLoading - diff).then(() => moduleExports);
    });
  });

// no more blinking in your app
const loaderDefaultOptions = {
  delay: 300, // if your asynchronous process is finished during 300 milliseconds you will not see the loader at all
  minimumLoading: 700, // but if it appears, it will stay for at least 700 milliseconds
};

// And the combination of these
// will secure us from having any kind of blinking in the process of asynchronous loadings

// INFO: the usage of `lazyComponent` looks like this:
// lazyComponent(() => import('pages/Welcome'))

function lazyComponent(
  loadComponent: LoadComponent,
  additionalProps?: AnyProps,
  loaderOptions: LoaderDefaultOptions = loaderDefaultOptions,
  FallbackWaiting: FC = AsyncLoader,
) {
  const Fallback = loaderOptions.delay ? getDelayedFallback(FallbackWaiting, loaderOptions.delay) : FallbackWaiting;

  const LazyComponent = getLazyComponent(loadComponent, loaderOptions);

  return function AsyncComponent(props: AnyProps) {
    return (
      <Suspense fallback={<Fallback />}>
        <LazyComponent {...additionalProps} {...props} />
      </Suspense>
    );
  };
}

export { lazyComponent };
