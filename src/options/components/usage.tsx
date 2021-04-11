import { FunctionComponent } from 'preact';
import { res } from 'options/utils';

const Usage: FunctionComponent = () => {
    return (
        <>
            <h2 id="usage">{res('optionsUsage')}</h2>
            <p>{res('optionsUsageIntro')}</p>
            <p>{res('optionsUsageButton')}</p>
            <img srcset="../img/button.png 2x" alt="button" />
            <p>{res('optionsUsageShortcut')}</p>
            <p>{res('optionsUsageMenu')}</p>
            <img srcset="../img/menu.png 2x" alt="button" />
        </>
    );
};

export { Usage };
