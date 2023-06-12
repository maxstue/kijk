import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@/lib/classnames';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Terms & Conditions',
  description: 'Read our lorem terms and conditions.',
};

export default function TermsPage() {
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
          <h1 className='pb-3 pt-6 text-3xl font-bold'>Terms & Conditions</h1>
          <p className='text-muted-foreground'>Read our lorem terms and conditions.</p>
          <Separator className='mb-3' />
          <p>
            Lorem ipsumMagna fermentum iaculis eu non diam. Vitae purus faucibus ornare suspendisse sed nisi lacus sed.
            In nibh mauris cursus mattis molestie a iaculis at. Enim sit amet venenatis urna. Eget sit amet tellus cras
            adipiscing.
          </p>
          <h2 className='pb-3 pt-6 text-xl font-bold'>Legal Notices</h2>
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
          <h2 className='pb-3 pt-6 text-xl font-bold'>Warranty Disclaimer</h2>
          <Separator className='mb-3' />
          <p>
            Tellus in hac habitasse platea dictumst vestibulum. Faucibus in ornare quam viverra. Viverra aliquet eget
            sit amet tellus cras adipiscing. Erat nam at lectus urna duis convallis convallis tellus. Bibendum est
            ultricies integer quis auctor elit sed vulputate. Nisl condimentum id venenatis a condimentum vitae. Ac
            auctor augue mauris augue neque gravida in fermentum. Arcu felis bibendum ut tristique. Tempor commodo
            ullamcorper a lacus vestibulum sed arcu non.
          </p>
          <h2 className='pb-3 pt-6 text-xl font-bold'>General</h2>
          <Separator className='mb-3' />
          <p>
            Magna fermentum iaculis eu non diam. Vitae purus faucibus ornare suspendisse sed nisi lacus sed. In nibh
            mauris cursus mattis molestie a iaculis at. Enim sit amet venenatis urna. Eget sit amet tellus cras
            adipiscing. Sed lectus vestibulum mattis ullamcorper velit. Id diam vel quam elementum pulvinar. In iaculis
            nunc sed augue lacus viverra. In hendrerit gravida rutrum quisque non tellus. Nisl purus in mollis nunc.
          </p>
          <h2 className='pb-3 pt-6 text-xl font-bold'>Disclaimer</h2>
          <Separator className='mb-3' />
          <p>
            Amet justo donec enim diam. In hendrerit gravida rutrum quisque non. Hac habitasse platea dictumst quisque
            sagittis purus sit. Faucibus ornare suspendisse sed nisi lacus. Nulla porttitor massa id neque aliquam
            vestibulum. Ante in nibh mauris cursus mattis molestie a. Mi tempus imperdiet nulla malesuada.
          </p>
        </div>
      </div>
    </div>
  );
}
