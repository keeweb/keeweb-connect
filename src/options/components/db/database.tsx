import { FunctionComponent } from 'preact';
import { res } from 'options/utils';
import { ConnectedDatabase, model } from 'options/settings-model';
import { ConnectedDatabaseState } from 'common/connected-database';

type DatabaseProps = {
    db: ConnectedDatabase;
};

const Database: FunctionComponent<DatabaseProps> = ({ db }) => {
    const disconnectDb = () => {
        model.disconnectDatabase(db);
    };

    return (
        <tr>
            <td>{db.name}</td>
            <td>
                {db.state === ConnectedDatabaseState.Open ? (
                    <span class="success">{res('optionsDatabaseStateOpen')}</span>
                ) : db.state === ConnectedDatabaseState.Closed ? (
                    <span class="error">{res('optionsDatabaseStateClosed')}</span>
                ) : null}
            </td>
            <td>
                <button class="destructive" onClick={disconnectDb}>
                    {res('optionsDatabaseActionDisconnect')}
                </button>
                <button class="destructive" onClick={disconnectDb}>
                    {res('optionsDatabaseActionDisconnect')}
                </button>
            </td>
        </tr>
    );
};

export { Database };
