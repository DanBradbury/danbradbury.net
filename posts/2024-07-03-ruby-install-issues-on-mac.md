title: Ruby Install Issues on Mac
----
I love `rvm` but won't pretend that I don't have to fight with it to stay on the latest version of Ruby when using my mac.

Here's an example that popped up when trying to work with the new [WriteBooks codebase](https://once.com/writebook) that was released the past week by the Basecamp team.

```
danbradbury•Documents/Github/writebook» rvm install "ruby-3.3.1"                                                                                                                                                                     [16:36:02]
ruby-3.3.1 - #removing src/ruby-3.3.1 - please wait
Searching for binary rubies, this might take some time.
No binary rubies available for: osx/14.4/arm64/ruby-3.3.1.
Continuing with compilation. Please read 'rvm help mount' to get more information on binary rubies.
Checking requirements for osx.
Certificates bundle '/opt/homebrew/etc/openssl@1.1/cert.pem' is already up to date.
Requirements installation successful.
Installing Ruby from source to: /Users/danbradbury/.rvm/rubies/ruby-3.3.1, this may take a while depending on your cpu(s)...
ruby-3.3.1 - #downloading ruby-3.3.1, this may take a while depending on your connection...
ruby-3.3.1 - #extracting ruby-3.3.1 to /Users/danbradbury/.rvm/src/ruby-3.3.1 - please wait
ruby-3.3.1 - #configuring - please wait
ruby-3.3.1 - #post-configuration - please wait
ruby-3.3.1 - #compiling - please wait
Error running '__rvm_make -j8',
please read /Users/danbradbury/.rvm/log/1720136164_ruby-3.3.1/make.log

There has been an error while running make. Halting the installation.
```

Looking at the log file that is referenced we see errors liks this..

```
compiling ossl_cipher.c
compiling eventids1.c
In file included from ossl_bio.c:10:
In file included from ./ossl.h:175:
./openssl_missing.h:195:11: warning: 'TS_VERIFY_CTS_set_certs' macro redefined [-Wmacro-redefined]
#  define TS_VERIFY_CTS_set_certs(ctx, crts) ((ctx)->certs=(crts))
          ^
/opt/homebrew/Cellar/openssl@3/3.3.0/include/openssl/ts.h:426:11: note: previous definition is here
#  define TS_VERIFY_CTS_set_certs(ctx, cert) TS_VERIFY_CTX_set_certs(ctx,cert)
          ^
1 warning generated.
In file included from ossl_bn.c:11:
In file included from ./ossl.h:175:
./openssl_missing.h:195:11: warning: 'TS_VERIFY_CTS_set_certs' macro redefined [-Wmacro-redefined]
#  define TS_VERIFY_CTS_set_certs(ctx, crts) ((ctx)->certs=(crts))
          ^
/opt/homebrew/Cellar/openssl@3/3.3.0/include/openssl/ts.h:426:11: note: previous definition is here
#  define TS_VERIFY_CTS_set_certs(ctx, cert) TS_VERIFY_CTX_set_certs(ctx,cert)
          ^
```

For those who know SSL is a pain in the ass on Mac and you will need to pass additional arguments to get the compilation to work correctly.. `TS_VERIFY_CTS_set_certs` was removed in the latest version of OpenSSL (3 is current). To combat this we need to run the following and use the 1.x version we have on our machine

```
rvm install "ruby-3.3.1" --with-openssl-dir=$(brew --prefix openssl@1.1)
```

For those curious and not familiar with the underlying `brew` usage all we are doing is using prefix to give us the path in which Homebrew installed the package (`man brew`)

I'm sure there's other gotchas on machines that aren't setup with Ruby already but that's an annoying one that I almost always forget about.
