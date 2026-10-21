/** E-mail address for legal, privacy and support requests. */
export const legalContactEmail = 'kijk@justmax.xyz';

/** Name, postal address and e-mail of the operator, as required for the imprint and the privacy policy. */
export function LegalContact() {
  return (
    <address className='not-italic'>
      Maximilian Stümpfl
      <br />
      Schubertstr. 15
      <br />
      75045 Walzbachtal
      <br />
      Germany
      <br />
      E-mail:{' '}
      <a className='underline underline-offset-4' href={`mailto:${legalContactEmail}`}>
        {legalContactEmail}
      </a>
    </address>
  );
}
