import { ConnectionBlock } from './connect/connection-block';
import { FunctionComponent } from 'preact';
import { Shortcuts } from './shortcuts';
import { Footer } from './footer';
import { DatabasesBlock } from './db/databases-block';

const MainBlock: FunctionComponent = () => {
    return (
        <>
            <ConnectionBlock />
            <DatabasesBlock />
            <Shortcuts />
            <Footer />
        </>
    );
};

export { MainBlock };
