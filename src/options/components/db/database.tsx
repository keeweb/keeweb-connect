import { FunctionComponent } from 'preact';
import { res } from 'options/utils';
import { ConnectedDatabase, model } from 'options/settings-model';
import { ConnectedDatabaseState } from 'common/connected-database';

type DatabaseProps = {
    db: ConnectedDatabase;
};

const Database: FunctionComponent<DatabaseProps> = ({ db }) => {
    const openDb = () => {
        model.openDatabase(db);
    };

    const closeDb = () => {
        model.closeDatabase(db);
    };

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
                {db.state === ConnectedDatabaseState.Open ? (
                    <button class="secondary" onClick={closeDb}>
                        {res('optionsDatabaseActionClose')}
                    </button>
                ) : db.state === ConnectedDatabaseState.Closed ? (
                    <button class="secondary" onClick={openDb}>
                        {res('optionsDatabaseActionOpen')}
                    </button>
                ) : null}
                <button class="destructive" onClick={disconnectDb}>
                    {res('optionsDatabaseActionDisconnect')}
                </button>
            </td>
        </tr>
    );
};

export { Database };
