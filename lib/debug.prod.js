/**
 * Method that does nothing but mimic the interface of the debug library.
 * For use in production builds.
 *
 * @return {function}
 */
module.exports = function() {
    return function() {};
};
