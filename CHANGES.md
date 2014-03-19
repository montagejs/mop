## 0.15.0

 - Fix pathing so that Mop works on Windows.
 - Replace JSDom with minidom. Now doesn't need to build any native modules,
   making installation a lot simpler.
 - Fix bundles for HTML entry points that are not at the root of the package.

### 0.14.1

 - Update minimum version of montage.

### 0.14.0

 - Companion release for MontageJS v0.14.

### 0.13.6

 - Bump Mr dependency to ~0.15.0, to fix bug with modules with "." in them

### 0.13.5

 - Fix independent modules creating different bundles
 - Bump Mr dependency to ~0.14.2, to fix a bug with projects that use `overlay` in the `package.json`, such as Montage

### 0.13.4

 - Bump Mr dependency to ~0.14.0

### 0.13.3

 - Don't include the npm-added `readme` property in the `package.json` of
   built apps.

### 0.13.2

 - Don't warn about module/filename case in dependencies

**API**

 - Return build path from main `optimize` function
 - Add `fs` to config object, so that that a mock FS can be injected for
   testing

### 0.13.1

 - Only support Mr ~0.13.0

**API**

 - Update to Q v0.9.6

## 0.13.0

 - Breaking change: change package.json "manifest" prop to "appcache", as it
   conflicts with the manifest property in Montage.
 - Enable CSS compression by default
 - Make compatible with bootstrapping of Montage 0.13
 - Improve JavaScript parse warning messages

**API**

 - Numerous dependency version bumps

### 0.12.8

 - Lock Q to version 0.9.2 to match Mr and avoid compatibility issues

### 0.12.7

 - Fix converting a document without a doctype to string
 - Continue when errors occur minifiying inline JavaScript

### 0.12.6

 - Keep properties from original package.json in bundled package.json
 - Don't change markup when incorrectly nested, as a result of upgrading
   html-minifier and other dependencies.
 - Add coverage reporting to tests

### 0.12.5

 - Browser prefixes are no longer removed when compressing CSS, as a result of
   replacing CSSOM with CSSO.
 - HTML doctype is preserved.
 - Fix rebasing of URLs with no protocol.
 - Fix bundle loading.
 - Don't warn about WebGL script tags.

### 0.12.4

 - Disable CSS compression by default as it breaks unrecognized syntax, most
   notably browser prefixes.
 - Add --css/-c flag to enable CSS compression.

### 0.12.3

 - Important: requires Mr ~0.12.6 to be used by packages.
 - Enabled production mode when optimizing to prevent devDependencies being
   loaded.
 - Exposed the `optimize` function as the exports of the package. See the
   readme for the API.

### 0.12.2

-   Fixed handling of "exclude" property in package.json.

## 0.12.1

-   Extensive refactor for Montage and Mr v0.12.
-   Mop now requires Montage > v0.12.2 or Mr > v0.12.0.
-   Bundling is no longer optional.
-   Incremental builds and shared build dependencies are no longer supported.
-   More internal changes. See
    https://github.com/montagejs/mop/commit/aa1368d40e20306217dec82def6d9e27832ebafa

### 0.0.7

-   Fixed file descriptor limit
-   Update for Q.done and improve some error messages.
-   Removed shrinkwrap.
-   Updated the documented transforms.

### 0.0.4

-   Added ``--copyright`` flag for verifying existence of copyright
    notices.
-   The ``--incremental`` flag is now on by default.

### 0.0.3

-   Fixed issue with obsolete manifest removal from the generated
    manifest.

### 0.0.1

-   Replaced JSLint with JSHint and added deep HTML inspection.

# 0.0.0

-   Initial release, forked from m-js

