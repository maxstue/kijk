import React from 'react';
import { siteConfig } from '@/constants/config';

export default function PrivacyPage() {
  return (
    <div className='flex w-full flex-col items-center'>
      <section className='my-6 max-w-[50vw]'>
        <h1 className='my-4 text-lg font-bold'>Privacy Policy</h1>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <p className='text-sm'>
              This Privacy Policy describes how your personal information is collected, used, and shared when you visit
              or make use of <strong>Kijk</strong> (the “Site”).
            </p>
          </div>
          <h2>Personal Information We Collect</h2>
          <div className='flex flex-col gap-2'>
            <h2>Information Collected Automatically</h2>
            <p className='text-sm'>
              When you visit the Site, we automatically collect certain information about your device, including
              information about your web browser, IP address, time zone, and some of the cookies that are installed on
              your device. Additionally, as you browse the Site, we collect information about the individual web pages
              or products that you view, what websites or search terms referred you to the Site, and information about
              how you interact with the Site. We refer to this automatically-collected information as “Device
              Information”.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>Information You Provide</h2>
            <p className='text-sm'>
              When you interact with the Site, you may provide us with certain personally identifiable information that
              can be used to contact or identify you.
              <br />
              This may include:
              <ul className='list-inside list-disc'>
                <li>Your name</li>
                <li>Your email address</li>
                <li>Any other information voluntarily provided by you</li>
              </ul>
              We refer to this information as “Personal Information”.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>Usage of Third-Party Services</h2>
            <p className='text-sm'>
              <ul className='list-inside list-disc'>
                <li>
                  Fly.io: We use Fly.io to optimize and deliver our web application. Fly.io may collect and process
                  information about your interactions with the Site for optimization purposes.
                </li>
                <li>
                  Vercel: We use Vercel to host our web application and may collect information about your usage for
                  performance monitoring and improvement.
                </li>
                <li>
                  Clerk: We use Clerk for user authentication and may collect and process your Personal Information to
                  manage user accounts securely.
                </li>
                <li>
                  Sentry: We use Sentry for error monitoring and may collect information about errors and crashes
                  occurring in the application to improve performance and stability.
                </li>
                <li>
                  Posthog: We use Posthog for analytics purposes to understand user behavior and optimize the user
                  experience.
                </li>
              </ul>
              Posthog: We use Posthog for analytics purposes to understand user behavior and optimize the user
              experience.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>How We Use Your Personal Information</h2>
            <p className='text-sm'>
              We use the Personal Information we collect to:
              <ul className='list-inside list-disc'>
                <li>Identify and authenticate users</li>
                <li>
                  Communicate with you, including sending you emails related to authentication and account management
                </li>
                <li>Monitor and analyze trends, usage, and activities in connection with the Site</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Personalize and improve the Site and our users’ experiences</li>
                <li>Comply with legal obligations</li>
              </ul>
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>Sharing Your Personal Information</h2>
            <p className='text-sm'>
              We do not sell, trade, or otherwise transfer to outside parties your Personal Information unless we
              provide users with advance notice. This does not include website hosting partners and other parties who
              assist us in operating our website, conducting our business, or serving our users, so long as those
              parties agree to keep this information confidential.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>Changes to This Privacy Policy</h2>
            <p className='text-sm'>
              We may update this privacy policy from time to time in order to reflect, for example, changes to our
              practices or for other operational, legal, or regulatory reasons. We encourage you to review this policy
              periodically for any changes. Changes will be effective immediately upon posting to the Site.
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <h2>Contact Us</h2>
            <p className='text-sm'>
              For more information about our privacy practices, if you have questions, or if you would like to make a
              complaint, please contact us by e-mail at <strong>{siteConfig.email}</strong>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
