import React from 'react';

const Transaction = ({ transaction }) => {
    const { input, outputMap, id } = transaction;
    const recipients = Object.keys(outputMap);

    return (
        <div className='transaction'>
            <div>Transaction ID: { id }</div>
            <div>From: { input.address }</div>
            <div>Balance: { input.amount }</div>
            {
                recipients.map(recipient => (
                        <div key={ recipient }>
                            To: { recipient } <br />
                            Sent: { outputMap[recipient] } <br /><br/>
                        </div>
                    )
                )
            }
        </div>
    )
}

export default Transaction;