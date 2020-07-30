import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import Transaction from './Transaction';

class Block extends Component {
    state = { displayTransaction: false };
    

    toggleTransactionDisplay = () => {
        this.setState({ displayTransaction: !this.state.displayTransaction });
    }

    get displayTransaction() {
        const { data } = this.props.block;
        const dataString = JSON.stringify(data);
        const dataDisplay = (dataString.length > 61)? dataString.substring(0, 61): dataString;
        
        if(this.state.displayTransaction) {
            return (
                <div>
                    <div>
                        {
                            data.map(transaction => (
                                <div key={ transaction.id }>
                                    <hr />
                                    <Transaction transaction={ transaction }/>
                                </div>
                            ))
                        }
                    </div>
                    <Button onClick={ this.toggleTransactionDisplay }>Show Less</Button>
                </div>
            );
        }
        return (
            <div>
                <div>Data: { dataDisplay }...</div>
                <Button onClick={ this.toggleTransactionDisplay }>Show More</Button>
            </div>
        );
    }
    render() {
        const { timestamp, hash } = this.props.block;
        const hashDisplay = `${hash.substring(0, 15)}...`;
        
        return (
            <div className='block'>
                <div>Hash: { hash }</div>
                <div>TimeStamp: { new Date(timestamp).toLocaleString() }</div>
                { this.displayTransaction }
            </div>
        )
    }
}

export default Block;