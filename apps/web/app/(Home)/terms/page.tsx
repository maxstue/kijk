import React from 'react';
import { siteConfig } from '@/constants/config';

export default function TermsPage() {
  return (
    <div className='flex w-full flex-col items-center'>
      <section className='my-6 max-w-[50vw]'>
        <h1 className='my-4 text-lg font-bold'>Terms of Service</h1>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <h2>1. Introduction</h2>
            <p className='text-sm'>
              Welcome to <strong>Kijk</strong> (the <i>Software</i>). By visiting our site and/ or purchasing
              subscriptions from us, you engage in our “Service” and agree to be bound by the following terms and
              conditions (“Terms of Service”, “Terms”). These Terms of Service apply to all users of the site. If you do
              not agree to these Terms, you may not use the Software.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>2. License</h2>
            <p className='text-sm'>
              The Software is licensed under the following terms: Permission is hereby granted, free of charge, to any
              person obtaining a copy of this software and associated documentation files (the <i>Software</i>), to deal
              in the Software without restriction, including without limitation the rights to use, copy, modify, merge,
              publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
              Software is furnished to do so, subject to the following conditions: The above copyright notice and this
              permission notice shall be included in all copies or substantial portions of the Software. In addition,
              any person or entity that uses, copies, modifies, merges, publishes, distributes, sublicenses, and/or
              sells copies of the Software, or permits persons to whom the Software is furnished to do so, for
              commercial purposes, must give appropriate credit, provide a link to the original source, and indicate if
              changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor
              endorses you or your use. THE SOFTWARE IS PROVIDED <i>AS IS</i>, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE
              AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
              OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
              CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>3. Attribution Requirements</h2>
            <p className='text-sm'>
              For commercial use of the Software, the following attribution requirements must be met: Credit:
              Appropriate credit must be given, which includes the name of the original author, a link to the original
              source, and an indication of any changes made to the Software. Notice: This information must be included
              in any product or service documentation, as well as in any digital or printed media where the Software is
              used. No Endorsement: The attribution should not suggest that the original author endorses the commercial
              use of the Software.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>4. Prohibited Uses</h2>
            <p className='text-sm'>
              You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service, use of
              the Service, or access to the Service or any contact on the website through which the service is provided,
              without express written permission by us. We are not responsible if information made available on this
              site is not accurate, complete, or current. The material on this site is provided for general information
              only and should not be relied upon or used as the sole basis for making decisions without consulting
              primary, more accurate, more complete, or more timely sources of information. Any reliance on the material
              on this site is at your own risk. We reserve the right to terminate your use of the Service or any related
              website for violating any of the prohibited uses.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>5. Modification and Termination</h2>
            <p className='text-sm'>
              We reserve the right at any time to modify or discontinue the Service (or any part or content thereof)
              without notice at any time. We reserve the right, at our sole discretion, to update, change or replace any
              part of these Terms of Service by posting updates and changes to our website. It is your responsibility to
              check our website periodically for changes. Your continued use of or access to our website or the Service
              following the posting of any changes to these Terms of Service constitutes acceptance of those changes.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>6. Limitation of Liability</h2>
            <p className='text-sm'>
              To the maximum extent permitted by law, in no event shall the authors or copyright holders be liable for
              any special, incidental, indirect, or consequential damages whatsoever arising out of the use of or
              inability to use the Software.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>7. Governing Law</h2>
            <p className='text-sm'>
              These Terms shall be governed by and construed in accordance with the laws of [Your Country/State],
              without regard to its conflict of law principles.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>8. Prices and Changes</h2>
            <p className='text-sm'>Prices for our products are subject to change without notice.</p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>9. Contact Information</h2>
            <p className='text-sm'>
              Questions about the Terms of Service should be sent to us at <strong>{siteConfig.email}</strong>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
