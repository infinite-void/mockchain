import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Block from './Block';
class Blocks extends Component {
    state = { blocks: [] };

    componentDidMount() {
        fetch(`${ document.location.origin }/api/blocks`)
            .then(response => response.json())
            .then(json => this.setState({ blocks: json }));
    }

    render() {
        console.log(this.state);
        return(
            <div>
                <br />
                <div>
                    <Link to='/'>Home</Link> 
                </div>
                <br />
                <h4>Blocks</h4>
                {
                    this.state.blocks.map( block => {
                        return(
                            <Block key={ block.hash } block={ block }/>
                        )
                    })
                }
            </div>
        );
    }
}

export default Blocks;