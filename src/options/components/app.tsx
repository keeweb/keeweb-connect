import { FunctionComponent } from 'preact';
import { model } from 'options/settings-model';
import { Header } from './header';
import { MainBlock } from './main-block';

const App: FunctionComponent = () => {
    return (
        <>
            <Header />
            {model.loaded ? <MainBlock /> : null}
        </>
    );
};

export { App };
