const message = `
##    ## ####       ## ##    ##
##   ##   ##        ## ##   ##
##  ##    ##        ## ##  ##
#####     ##        ## #####
##  ##    ##  ##    ## ##  ##
##   ##   ##  ##    ## ##   ##
##    ## ####  ######  ##    ##

01001011 01001001 01001010 01001011

Welcome to Kijk, your space app.
Feedback, bug reports and suggestions are welcome on GitHub: https://github.com/maxstue/kijk/discussions
`;

/** A welcome message for users in the browser console. */
export function welcome() {
  console.log(`${message}`);
}

/**
 * Capitalizes the first letter of a string.
 *
 * @param name The name to capitalize
 * @returns The capitalized name
 */
export function capitalizeFirstLetter(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}
