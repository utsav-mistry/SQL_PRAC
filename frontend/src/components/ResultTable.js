import React from 'react';
import PropTypes from 'prop-types';
import '../styles/result-table.css';

const ResultTable = ({ title = 'Query Result', result, elapsed, rowCount }) => {
    const { fields = [], rows = [] } = result;

    if (!fields.length) {
        return (
            <section className="result">
                <header className="result__header">
                    <div className="result__header-left">
                        <h2 className="result__title">{title}</h2>
                    </div>
                    <div className="result__header-right">
                        {rowCount != null && (
                            <span className="result__metric">
                                <i className="fa-solid fa-database" aria-hidden="true" />
                                {rowCount} row{rowCount === 1 ? '' : 's'}
                            </span>
                        )}
                        {elapsed != null && (
                            <span className="result__metric">
                                <i className="fa-regular fa-clock" aria-hidden="true" />
                                {elapsed} ms
                            </span>
                        )}
                    </div>
                </header>
                <p className="result__empty">Your statement ran successfully but returned no data.</p>
            </section>
        );
    }

    return (
        <section className="result">
            <header className="result__header">
                <div className="result__header-left">
                    <h2 className="result__title">{title}</h2>
                </div>
                <div className="result__header-right">
                    {rowCount != null && (
                        <span className="result__metric">
                            <i className="fa-solid fa-database" aria-hidden="true" />
                            {rowCount} row{rowCount === 1 ? '' : 's'}
                        </span>
                    )}
                    {elapsed != null && (
                        <span className="result__metric">
                            <i className="fa-regular fa-clock" aria-hidden="true" />
                            {elapsed} ms
                        </span>
                    )}
                </div>
            </header>

            <div className="result__table-wrapper">
                <table className="result__table">
                    <thead>
                        <tr>
                            {fields.map((field) => (
                                <th key={field}>{field}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={index}>
                                {fields.map((field) => (
                                    <td key={field}>
                                        {row[field] === null || row[field] === undefined ? (
                                            <span className="result__null">NULL</span>
                                        ) : (
                                            String(row[field])
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

ResultTable.propTypes = {
    title: PropTypes.string,
    result: PropTypes.shape({
        fields: PropTypes.arrayOf(PropTypes.string),
        rows: PropTypes.arrayOf(PropTypes.object)
    }).isRequired,
    elapsed: PropTypes.number,
    rowCount: PropTypes.number
};

ResultTable.defaultProps = {
    elapsed: null,
    rowCount: null
};

export default ResultTable;
