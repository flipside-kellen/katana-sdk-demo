



import React from 'react';
import './App.css';

import { Flipside, Query, Row } from "@flipsidecrypto/sdk";
import { Button, Form } from 'react-bootstrap';

const API_KEY: string = `${process.env.REACT_APP_API_KEY}`;

const getQuery = (address: string) => {
	const query: Query = {
	  sql: `
		SELECT
			block_timestamp,
			'Deposit' as action,
			'SOL Covered Call' as vault,
			'8vyTqVVPmJfqFexRcMBGDAHoSCyZ52RC5sRVhYzbfU4j' as vault_address,
			inner_instruction:index as index,
			tx_id,
			inner_instruction:instructions [0] :parsed:info:authority as user_wallet,
			inner_instruction:instructions [0] :parsed:info:amount / 1e9 as amount
		FROM
			solana.core.fact_events
		WHERE
			program_id = '1349iiGjWC7ZTbu6otFmJwztms122jEEnShKgpVnNewy'
			and inner_instruction:instructions [0] :parsed:info:destination = '8vyTqVVPmJfqFexRcMBGDAHoSCyZ52RC5sRVhYzbfU4j'
			and inner_instruction:instructions [0] :parsed:type = 'transfer'
			and SUCCEEDED = 'TRUE'
			and user_wallet = '${address}'
		UNION
		SELECT
			e.block_timestamp,
			'Withdraw' as action,
			'SOL Covered Call' as vault,
			'8vyTqVVPmJfqFexRcMBGDAHoSCyZ52RC5sRVhYzbfU4j' as vault_address,
			inner_instruction:index as index,
			e.tx_id,
			case when array_size(instruction:accounts) > 12 then 
				instruction:accounts [1]
				when array_size(instruction:accounts) < 10 then 
				instruction:accounts [6]
				else
				instruction:accounts [9]
			end as user_wallet,
			case when inner_instruction:instructions [1] :parsed:type = 'transfer' then
				inner_instruction:instructions [1] :parsed:info:amount / 1e9
			else
				inner_instruction:instructions [0] :parsed:info:amount / 1e9
			end as amount
		FROM
			solana.core.fact_events e
		WHERE
			program_id = '1349iiGjWC7ZTbu6otFmJwztms122jEEnShKgpVnNewy'
			AND (
				(
					inner_instruction:instructions [1] :parsed:info:source = '8vyTqVVPmJfqFexRcMBGDAHoSCyZ52RC5sRVhYzbfU4j'
					AND inner_instruction:instructions [1] :parsed:type = 'transfer'
				)
				OR (
					inner_instruction:instructions [0] :parsed:info:source = '8vyTqVVPmJfqFexRcMBGDAHoSCyZ52RC5sRVhYzbfU4j'
					AND inner_instruction:instructions [0] :parsed:type = 'transfer'
				)
			) and SUCCEEDED = 'TRUE'
			and user_wallet = '${address}'
		UNION
		SELECT
			block_timestamp,
			'Initiate Withdraw' as action,
			'SOL Covered Call' as vault,
			'DRLcUXwMcFf8itWJy7NdzKuWrZep1HceLaTgRRDs51SH' as vault_address,
			inner_instruction:index as index,
			tx_id,
			inner_instruction:instructions [0] :parsed:info:authority as user_wallet,
			inner_instruction:instructions [0] :parsed:info:amount / 1e9 as amount
		FROM
			solana.core.fact_events
		WHERE
			program_id = '1349iiGjWC7ZTbu6otFmJwztms122jEEnShKgpVnNewy'
			and inner_instruction:instructions [0] :parsed:info:destination = 'DRLcUXwMcFf8itWJy7NdzKuWrZep1HceLaTgRRDs51SH'
			and inner_instruction:instructions [0] :parsed:type = 'transfer'
			and SUCCEEDED = 'TRUE'
			and user_wallet = '${address}'
	  `,
	  ttlMinutes: 10,
	};
	return(query);
}


function App() {
	const [ address, setAddress ] = React.useState('');
	const [ label, setLabel ] = React.useState('');
	const [ fmp, setFmp ] = React.useState('');
	const base: Row[] = []
	const [ data, setData ] = React.useState(base);

	const runSDKApi = async (address: string) => {
		const flipside = new Flipside(
			API_KEY,
			"https://node-api.flipsidecrypto.com"
		);
		console.log(`Running query for address ${address}`);
		
		const query = getQuery(address);
		const start = new Date().getTime();
		const result = await flipside.query.run(query);
		const end = new Date().getTime();
		console.log(`Took ${Math.round((end - start) / 1000)} seconds to run the query`);
		
		console.log(`result for address ${address}`);
		console.log(result.rows);
		if (result.rows) {
			setData(result.rows);
		}
	}

	const handler = (e: any) => {
		runSDKApi(address);
	}
	const cols = [ 'BLOCK_TIMESTAMP', 'ACTION', 'VAULT', 'VAULT_ADDRESS', 'INDEX', 'TX_ID', 'USER_WALLET', 'AMOUNT']
	
	const rows = data.map(x => {
		return(<tr>
			{x.map( y => {return(<td>{y}</td>)} ) }
		</tr>)
	});
	const thead = <thead>
		{cols.map(x => {return(<th>{x}</th>)})}
	</thead>;
  return (
    <div className="App">
      <header className="App-header">
		<h1>SOL Covered Call Finder</h1>
		<div>
			<Form>
				<Form.Group className="mb-3" controlId="form">
					<Form.Control value={address} type="address" placeholder="Enter Wallet Address" onChange={evt =>setAddress(evt.target.value)} />
				</Form.Group>
				<Button variant="primary" onClick={handler}>
					Load the results!
				</Button>
			</Form>
		</div>
		<div>
			<table>
				{thead}
				<tbody>
					{rows}
				</tbody>
			</table>
		</div>
      </header>
    </div>
  );
}

export default App;
