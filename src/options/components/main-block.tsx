import { ConnectionBlock } from './connect/connection-block';
import { FunctionComponent } from 'preact';
import { Shortcuts } from './shortcuts';
import { Footer } from './footer';

const MainBlock: FunctionComponent = () => {
    return (
        <>
            <ConnectionBlock />
            <Shortcuts />
            <Footer />
        </>
    );
};

export { MainBlock };
