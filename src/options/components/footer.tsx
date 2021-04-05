import { FunctionComponent } from 'preact';
import { res } from 'options/utils';

const Footer: FunctionComponent = () => {
    return (
        <>
            <h2 id="about">{res('optionsAbout')}</h2>
            <p>{res('optionsAboutLicense')}:</p>
            <ul>
                <li>
                    <a href="https://preactjs.com/" target="_blank" rel="noreferrer">
                        Preact
                    </a>
                    , fast 3kB React alternative with the same modern API, &copy; 2015-present Jason
                    Miller
                </li>
                <li>
                    <a href="https://nodejs.org/en/" target="_blank" rel="noreferrer">
                        Node.js
                    </a>
                    , JavaScript runtime, &copy; Node.js contributors
                </li>
                <li>
                    <a href="https://tweetnacl.js.org/" target="_blank" rel="noreferrer">
                        TweetNaCl.js
                    </a>
                    , port of TweetNaCl cryptographic library to JavaScript, public domain
                </li>
            </ul>
            <p>Copyright &copy; {new Date().getFullYear()} KeeWeb</p>
            <p>
                Permission is hereby granted, free of charge, to any person obtaining a copy of this
                software and associated documentation files (the "Software"), to deal in the
                Software without restriction, including without limitation the rights to use, copy,
                modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
                and to permit persons to whom the Software is furnished to do so, subject to the
                following conditions:{' '}
            </p>
            <p>
                The above copyright notice and this permission notice shall be included in all
                copies or substantial portions of the Software.
            </p>
            <p>
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
                HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
                CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
                OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
            </p>
        </>
    );
};

export { Footer };
