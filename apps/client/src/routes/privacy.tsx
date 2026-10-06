import { createFileRoute } from '@tanstack/react-router';

/** `/privacy`: privacy policy. */
export const Route = createFileRoute('/privacy')({ component: PrivacyPolicy });

function PrivacyPolicy() {
  return (
    <main className='mx-auto max-w-3xl space-y-8 px-4 py-12'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-semibold'>Privacy Policy</h1>
        <p className='text-muted-foreground'>Last updated: 5 October 2026</p>
      </header>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Spaces and who can see your data</h2>
        <p>
          Kijk organizes data in spaces. Every user has a personal space that is never shared. You can also belong to
          shared spaces, for example with your household, flatmates or partner. Data in a shared space is visible to its
          members according to their role. Accounts and budgets in a shared space can be marked as private; private
          accounts, their transactions and imports, and private budgets are visible only to the member who owns them,
          including to administrators of the space.
        </p>
        <p>
          Category rules you remember from a shared account apply to the whole space, and its members see the
          counterparty&apos;s name in the list of remembered rules. Rules you remember from a private account stay
          private: only you see them, and they only apply to your private accounts.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Resources, budgets and transactions</h2>
        <p>
          To provide Kijk, we store the information you enter or import: resources and consumption readings, limits,
          categories, budgets, bank accounts and transactions. For a transaction this includes the booking date, amount,
          currency, counterparty, a cleaned purpose text, its status and category. Of a bank account we store its name
          and at most the last four characters of its IBAN.
        </p>
        <p>
          Transactions can reveal sensitive information, for example about health, religion or memberships. We process
          them only to show your budgets and statistics and do not analyze them for other purposes.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Bank file imports</h2>
        <p>
          When you upload a bank export (CSV), the file is stored encrypted and processed in the background. It is
          deleted as soon as the import is finished or cancelled, and at the latest after 24 hours, also when the import
          fails. Rows waiting for your review are deleted with the file; only the transactions you import remain.
        </p>
        <p>
          Before transactions are stored, IBANs, card numbers, reference numbers and e-mail addresses are removed from
          the purpose text. Counterparty IBANs, creditor identifiers and mandate references are never stored in clear
          text; we keep only keyed hashes so that later imports can recognize the same booking or counterparty and keep
          your corrections. This is pseudonymization, not anonymization. In the import settings of a space you can
          shorten or drop the purpose text and choose to store as little as possible, which also replaces the names of
          private persons and keeps no counterparty hashes.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Optional AI features</h2>
        <p>
          Kijk can use an AI service to recognize the columns of an unknown bank file format and to suggest categories
          for transactions. Both features are optional. You can turn AI off for your account in Settings → Info; Kijk
          then never sends data to the AI service on your behalf. Each space sets whether its imports offer AI
          categorization by default; nothing is sent until you start it for an import.
        </p>
        <p>
          For format recognition, the AI service receives only column names and masked value patterns, never the values
          themselves. For categorization, it receives only the counterparty and the purpose text of transactions without
          a category, after IBANs, reference numbers, e-mail addresses and the names of private persons and space
          members have been replaced, plus whether money came in or went out. Amounts, dates and account details are
          never sent. You see exactly what would be sent before you start the categorization, can deselect individual
          texts, and the AI&apos;s suggestions are only proposals until you import the transactions. Names cannot be
          recognized with certainty; deselect anything you want to keep private.
        </p>
        <p>
          The AI service is Mistral AI, which processes these requests on its infrastructure in the European Union.
          Mistral AI acts as our processor; it may not use the data to train models and does not retain it after
          answering. Kijk does not log the requests or the answers.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Sign in with Google</h2>
        <p>
          If you choose Google sign-in, Google shares basic account information with our authentication provider, Clerk,
          so we can authenticate you and connect your Google identity to your Kijk account. This may include your Google
          account identifier, email address, name, and profile image when available. We use this information only to
          create or access your Kijk account, maintain the sign-in connection, and identify your account in Kijk.
        </p>
        <p>
          Kijk does not request access to Gmail, Google Drive, Calendar, Contacts, or other Google services. We do not
          sell Google account information, use it for advertising, or use it to train AI or machine-learning models. We
          share Google sign-in information with Clerk to provide authentication. If you consent to optional product
          analytics, PostHog receives a pseudonymous Kijk account identifier and app usage events as described below. We
          do not provide Google passwords or Google API access tokens to PostHog.
        </p>
        <p>
          The Google identity connection is kept while your Kijk account is active. When you delete your account in
          Settings → Info, Kijk also deletes your sign-in at Clerk, which ends the connection to your Google identity.
          Google handles its own account records under its privacy terms.
        </p>
        <p>
          The production Google sign-in flow uses HTTPS. Google passwords remain with Google; Kijk does not receive
          them. The Google OAuth client secret is kept outside the browser and application source code. Kijk does not
          use Google access to call Google APIs.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Technical error reporting</h2>
        <p>
          Kijk processes technical error reports to detect and fix failures and keep the service secure and reliable.
          This is separate from optional analytics and route-performance tracing and remains active when consent is
          declined or withdrawn.
        </p>
        <p>
          Reports may contain an event time, app version, operating environment, error type, scrubbed technical stack
          locations, HTTP status and a short-lived request correlation ID. They do not intentionally contain account or
          authentication identifiers, names, email addresses, cookies, authorization headers, query values, submitted
          form data, request or response bodies, uploaded files, or space, resource, consumption, budget or transaction
          values.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Optional analytics and performance tracing</h2>
        <p>
          With your consent, Kijk enables product analytics with PostHog and Sentry router tracing. PostHog receives a
          pseudonymous Kijk account identifier and app usage events. Router tracing samples 10% of navigations and sends
          sanitized route templates and timing information. Concrete route parameters, query values, request tracing and
          user identifiers are excluded. You can withdraw consent in Settings at any time; no new analytics events or
          performance traces are then sent.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Purpose and legal basis</h2>
        <ul className='list-disc space-y-2 pl-6'>
          <li>
            Your account, spaces and the data you enter or import are processed to provide Kijk to you (GDPR Article
            6(1)(b)).
          </li>
          <li>
            Optional analytics, performance tracing and the AI features are based on your consent (Article 6(1)(a)),
            which you can withdraw at any time in Settings with effect for the future.
          </li>
          <li>
            Technical error reporting is based on our legitimate interest in operating a secure, stable service (Article
            6(1)(f)). We limit the data and disable behavioral breadcrumbs and profiling to reduce the impact on you.
            You may object by contacting the address shown in the app settings; we will assess your request as required
            by law.
          </li>
        </ul>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Service providers and transfers</h2>
        <p>We use the following processors:</p>
        <ul className='list-disc space-y-2 pl-6'>
          <li>Clerk for authentication.</li>
          <li>Railway for hosting the application and its database.</li>
          <li>Sentry for technical error reports and, with your consent, performance tracing.</li>
          <li>PostHog for product analytics, only with your consent.</li>
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
        </ul>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Your rights</h2>
        <p>
          You may request access, correction, deletion or restriction, object to processing, receive your data in a
          portable format, withdraw consent at any time, and lodge a complaint with your competent data-protection
          authority. You can export your transactions and consumptions as CSV in the app and delete your account and all
          your data yourself in Settings → Info. For other requests, use the contact details shown there.
        </p>
      </section>
    </main>
  );
}
