export function PrivacyDataProcessing() {
  return (
    <>
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
          Transactions can reveal special categories of personal data, for example about health, religion, political
          opinions or union membership. Before your first bank import, we therefore ask for your explicit consent. We
          process transactions only to show your budgets and statistics and do not analyze them for other purposes. You
          can withdraw the consent in Settings → Info; Kijk then no longer imports bank exports for you. Transactions
          you already imported stay until you delete them or your account.
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
    </>
  );
}
