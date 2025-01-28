import { memo, useEffect } from 'react';

interface Props {
  title?: string;
}

// REFACTOR: use new React 19 title API
export const Head = memo(function Head({ title }: Props) {
  useEffect(() => {
    document.title = title ? `${title} | Kijk` : 'Kijk';
  }, [title]);

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
});
