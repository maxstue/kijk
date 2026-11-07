export function PrivacyRights() {
  return (
    <>
      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Purpose and legal basis</h2>
        <ul className='list-disc space-y-2 pl-6'>
          <li>
            Your account, spaces and the data you enter or import are processed to provide Kijk to you (GDPR Article
            6(1)(b)).
          </li>
          <li>
            Bank transactions that may reveal special categories of personal data are processed based on your explicit
            consent (Article 9(2)(a)), which you give before your first bank import and can withdraw at any time in
            Settings with effect for the future.
          </li>
          <li>
            Optional analytics, performance tracing and the AI features are based on your consent (Article 6(1)(a)),
            which you can withdraw at any time in Settings with effect for the future.
          </li>
          <li>
            Technical error reporting is based on our legitimate interest in operating a secure, stable service (Article
            6(1)(f)). We limit the data and disable behavioral breadcrumbs and profiling to reduce the impact on you.
            You may object by contacting us at the address under Controller; we will assess your request as required by
            law.
          </li>
        </ul>
      </section>
      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Service providers and transfers</h2>
        <p>We use the following processors:</p>
        <ul className='list-disc space-y-2 pl-6'>
          <li>Clerk for authentication.</li>
          <li>Railway for hosting the application, its database and its backups.</li>
          <li>
            Sentry for technical error reports, anonymous server traces and, with your consent, performance tracing.
          </li>
          <li>
            PostHog for technical error reports, anonymous server traces, voluntary feedback and the settings of feature
            switches, and, only with your consent, product analytics and performance tracing.
          </li>
          <li>Mistral AI for the optional AI features, in the European Union.</li>
        </ul>
        <p>
          Some of these providers or their subprocessors may process data outside the European Economic Area. Such
          transfers rely on the safeguards described in their data processing agreements, such as the EU-U.S. Data
          Privacy Framework or the European Commission&apos;s Standard Contractual Clauses.
        </p>
      </section>
      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Retention</h2>
        <ul className='list-disc space-y-2 pl-6'>
          <li>
            Your account, spaces and the data in them are kept until you delete them or your account. Deleting your
            account in Settings → Info removes your personal space, spaces you are the only member of, your private
            accounts, transactions, budgets and rules, and your sign-in. Data you added to spaces shared with others
            stays there for the other members.
          </li>
          <li>
            Uploaded bank files and rows waiting for review are deleted after the import, at the latest after 24 hours.
          </li>
          <li>Technical error events are retained for no longer than 30 days.</li>
          <li>
            Kijk backs up its database once a month. Backups are stored encrypted with our hosting provider Railway in
            the European Union and deleted after at most 12 months. Data you delete stays in existing backups until they
            are deleted; we only use backups to restore the service after a failure.
          </li>
        </ul>
      </section>
      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Your rights</h2>
        <p>
          You may request access, correction, deletion or restriction, object to processing, receive your data in a
          portable format, withdraw consent at any time, and lodge a complaint with your competent data-protection
          authority. You can export your transactions and consumptions as CSV in the app and delete your account and all
          your data yourself in Settings → Info. For other requests, contact us at the address under Controller.
        </p>
      </section>
    </>
  );
}
