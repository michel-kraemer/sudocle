<h1 align="center">
  <br>
  <br>
  <img width="500" src="assets/logo.svg" alt="Sudocle">
  <br>
  <br>
  <br>
</h1>

> A modern web app for Sudoku

[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Sudocle offers the following features:

* Lightweight and clean look
* Optimised for various devices (mobile and desktop) as well as screens (any
  size and resolution)
* Configurable interface:
  * Multiple themes (including dark mode)
  * Multiple colour palettes (including one optimised for colour blindness)
  * and other options
* Fully compatible to puzzles published by [Cracking the Cryptic](https://www.youtube.com/c/CrackingTheCryptic)
  (see [usage instructions](#using-the-online-version) below)
* High performance graphics renderer using WebGL or HTML Canvas

Sudocle has been inspired by the official web app of
[Cracking the Cryptic](https://www.youtube.com/c/CrackingTheCryptic), the
world’s most popular YouTube channel about Sudoku and other logic puzzles.

## Using the online version

An online version of Sudocle is available at:

https://michelkraemer.com/sudocle

If you want to play one of the puzzles featured on
[Cracking the Cryptic](https://www.youtube.com/c/CrackingTheCryptic) in
Sudocle, just copy the puzzle's ID from the CTC webapp and append it to the
URL shown above.

For example, the “Miracle Sudoku” by Mitchell Lee, one of the most popular
puzzles ever featured on the channel, has the following URL:

https://app.crackingthecryptic.com/sudoku/tjN9LtrrTL

This URL becomes:

https://michelkraemer.com/sudocle/tjN9LtrrTL

## Building and running Sudocle locally

Sudocle requires [Node.js](https://nodejs.org/) v15 or higher. Run the
application in development mode with the following commands:

    npm install
    npm run dev

Open your web browser and go to <http://localhost:3000> to open the main page.
Just like with the online version, you can append a Cracking the Cryptic puzzle
ID to the URL (e.g. <http://localhost:3000/tjN9LtrrTL>).

Sudocle has been built with [Next.js](https://nextjs.org/). In development mode,
Next.js watches for source code changes and automatically refreshes the
application in the browser.

If you want to build Soducle in production mode, use the following command:

    npm run build

This will create a directory called `out`, which you can upload to your web
server or use it with [Docker](https://www.docker.com/) as follows:

    docker build -t sudocle .
    docker run -it -p 80:80 sudocle

Then, open <http://localhost/sudocle/>.

## What does “Sudocle” mean?

The name *Sudoko* is an abbreviation of the Japanese expression “Sūji wa
dokushin ni kagiru” (数字は独身に限る), which can be translated to “the digits
must be single” [[Wikipedia](https://en.wikipedia.org/wiki/Sudoku)]. *Sūji*
means *digits*.

A *monocle*, a *binocle*, or a pair of *binoculars* are things that help people
see.

*Sudocle* therefore helps people see digits 🤓😉

## License

Sudocle is released under the **MIT license**. See the [LICENSE](LICENSE) file
for more information.
