import { FunctionComponent } from 'preact';
import { res } from 'options/utils';
import { model } from 'options/settings-model';
import { Database } from './database';
import { BackendConnectionState } from 'common/backend-connection-state';

const DatabasesBlock: FunctionComponent = () => {
    const connectDb = () => {
        model.connectDatabase();
    };

    return (
        <>
            <h2 id="databases">{res('optionsDatabases')}</h2>
            {model.backendConnectionState === BackendConnectionState.Connected ? (
                <>
                    {model.databases.length ? (
                        <table>
                            <thead>
                                <tr>
                                    <th width="25%">{res('optionsDatabasesName')}</th>
                                    <th width="25%">{res('optionsDatabasesState')}</th>
                                    <th width="50%">{res('optionsDatabasesActions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {model.databases.map((db) => (
                                    <Database db={db} />
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>{res('optionsDatabasesEmpty')}</p>
                    )}
                    <button onClick={connectDb}>{res('optionsDatabasesConnectDb')}</button>
                </>
            ) : (
                <>
                    <p>{res('optionsDatabasesConnectToOpen')}</p>
                </>
            )}
        </>
    );
};

export { DatabasesBlock };
