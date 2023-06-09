import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@/lib/classnames';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Privacy',
  description: 'The Lorem Privacy Policy for kijk App.',
};

export default function PrivacyPage() {
  return (
    <div className='container mb-8 h-screen w-full flex-col items-center justify-center'>
      <div className='lg:p-8'>
        <div className='flex w-full justify-between'>
          <Link href='/' className={cn(buttonVariants({ variant: 'ghost' }))}>
            <>
              <ChevronLeft className='mr-2 h-4 w-4' />
              Back
            </>
          </Link>
        </div>
        <div className='flex flex-col'>
          <h1 className='pb-3 pt-6 text-3xl font-bold'>Privacy Policy</h1>
          <p className='text-muted-foreground'>The Lorem Privacy Policy for kijk App.</p>
          <Separator className='mb-3' />
          <p>
            Blandit libero volutpat sed cras ornare arcu. Cursus sit amet dictum sit amet. Nunc vel risus commodo
            viverra maecenas accumsan. Libero id faucibus nisl tincidunt eget nullam non nisi est. Varius quam quisque
            id diam vel quam. Id donec ultrices tincidunt arcu non.
          </p>
          <h2 className='pb-3 pt-6 text-xl font-bold'>Consent</h2>
          <Separator className='mb-3' />
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Volutpat sed cras ornare arcu. Nibh ipsum consequat nisl vel pretium lectus quam id
            leo. A arcu cursus vitae congue. Amet justo donec enim diam. Vel pharetra vel turpis nunc eget lorem.
            Gravida quis blandit turpis cursus in. Semper auctor neque vitae tempus. Elementum facilisis leo vel
            fringilla est ullamcorper eget nulla. Imperdiet nulla malesuada pellentesque elit eget. Felis donec et odio
            pellentesque diam volutpat commodo sed. Tortor consequat id porta nibh. Fames ac turpis egestas maecenas
            pharetra convallis posuere morbi leo. Scelerisque fermentum dui faucibus in. Tortor posuere ac ut consequat
            semper viverra.
          </p>
          <h2 className='pb-3 pt-6 text-xl font-bold'>Information we collect</h2>
          <Separator className='mb-3' />
          <p>
            Amet justo donec enim diam. In hendrerit gravida rutrum quisque non. Hac habitasse platea dictumst quisque
            sagittis purus sit.
          </p>
          <h2 className='pb-3 pt-6 text-xl font-bold'>How we use your Information</h2>
          <Separator className='mb-3' />
          <p>
            Ut sem nulla pharetra diam sit amet nisl suscipit adipiscing. Consectetur adipiscing elit pellentesque
            habitant. Ut tristique et egestas quis ipsum suspendisse ultrices gravida.
          </p>
        </div>
      </div>
    </div>
  );
}
