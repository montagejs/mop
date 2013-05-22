# 0.12.6

 - Keep properties from original package.json in bundled package.json
 - Don't change markup when incorrectly nested, as a result of upgrading
   html-minifier and other dependencies.
 - Add coverage reporting to tests

# 0.12.5

 - Browser prefixes are no longer removed when compressing CSS, as a result of
   replacing CSSOM with CSSO.
 - HTML doctype is preserved.
 - Fix rebasing of URLs with no protocol.
 - Fix bundle loading.
 - Don't warn about WebGL script tags.

# 0.12.4

 - Disable CSS compression by default as it breaks unrecognized syntax, most
   notably browser prefixes.
 - Add --css/-c flag to enable CSS compression.

# 0.12.3

 - Important: requires Mr ~0.12.6 to be used by packages.
 - Enabled production mode when optimizing to prevent devDependencies being
   loaded.
 - Exposed the `optimize` function as the exports of the package. See the
   readme for the API.

# 0.12.2

-   Fixed handling of "exclude" property in package.json.

# 0.12.1

-   Extensive refactor for Montage and Mr v0.12.
-   Mop now requires Montage > v0.12.2 or Mr > v0.12.0.
-   Bundling is no longer optional.
-   Incremental builds and shared build dependencies are no longer supported.
-   More internal changes. See
    https://github.com/montagejs/mop/commit/aa1368d40e20306217dec82def6d9e27832ebafa

# 0.0.7

-   Fixed file descriptor limit
-   Update for Q.done and improve some error messages.
-   Removed shrinkwrap.
-   Updated the documented transforms.

# 0.0.4

-   Added ``--copyright`` flag for verifying existence of copyright
    notices.
-   The ``--incremental`` flag is now on by default.

# 0.0.3

-   Fixed issue with obsolete manifest removal from the generated
    manifest.

# 0.0.1

-   Replaced JSLint with JSHint and added deep HTML inspection.

# 0.0.0

-   Initial release, forked from m-js

