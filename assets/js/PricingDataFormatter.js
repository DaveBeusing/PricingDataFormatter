/**
 * Copyright (c) 2025 Dave Beusing <david.beusing@gmail.com>
 *
 * MIT License - https://opensource.org/license/mit/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
class PricingDataFormatter {
	constructor(){
		this.html = {
			outputData : this.$( 'outputData' ),
			inputData : this.$( 'inputData' ),
			errorOutput : this.$( 'errorOutput' ),
			showSKU : this.$( 'showSKU' ),
			showQTY : this.$( 'showQTY' ),
			showPrice : this.$( 'showPrice' ),
			showPlaceholder : this.$( 'showPlaceholder' ),
			showTable : this.$( 'showTable' ),
			buttonExport : this.$( 'buttonExport' ),
			buttonClear : this.$( 'buttonClear' ),
			resultTable : this.$( 'resultTable' ),
			tableHeader : this.$( 'tableHeader' ),
			tableBody : this.$( 'tableBody' )
		};
		this.init();
	}
	$( element ){
		return document.getElementById( element );
	}
	init(){
		this.html.inputData.addEventListener( 'input', (event) => {
			this.process();
		});
		this.html.showTable.addEventListener( 'change', (event) => {
			this.process();
		});
		this.html.showSKU.addEventListener( 'change', (event) => {
			this.process();
		});
		this.html.showQTY.addEventListener( 'change', (event) => {
			this.process();
		});
		this.html.showPrice.addEventListener( 'change', (event) => {
			this.process();
		});
		this.html.showPlaceholder.addEventListener( 'change', (event) => {
			this.process();
		});
		this.html.buttonExport.addEventListener( 'click', (event) => {
			this.exportCSV();
		});
		this.html.buttonClear.addEventListener( 'click', (event) => {
			this.clear();
		});
	}
	process(){
		const rawData = this.html.inputData.value;
		const isSKU = this.html.showSKU.checked;
		const isQTY = this.html.showQTY.checked;
		const isPrice = this.html.showPrice.checked;
		const isPlaceholder = this.html.showPlaceholder.checked;
		const isTable = this.html.showTable.checked;
		const { data: result, error } = this.format( rawData, isQTY, isSKU, isPrice );
		const errorOutput = this.html.errorOutput;
		const outputData = this.html.outputData;
		const header = this.html.tableHeader;
		const body = this.html.tableBody;
		header.innerHTML = '';
		body.innerHTML = '';
		if( !isTable ){
			this.html.resultTable.style.display = 'none';
		}
		else {
			this.html.resultTable.style.display = 'table';
		}
		errorOutput.textContent = '';
		outputData.value = '';
		if( error ){
			errorOutput.textContent = error;
			return;
		}
		if( isSKU ) header.innerHTML += '<th>SKU</th>';
		if( isQTY ) header.innerHTML += '<th>QTY</th>';
		if( isPrice ) header.innerHTML += '<th>Price</th>';
		const lines = [];
		result.forEach( row => {
			if( !isPlaceholder ){
				if( row.isPlaceholder ) return;
			}
			let tr = '<tr>';
			lines.push( row.values.join( ";" ) );
			row.values.forEach( cell => {
				tr += `<td>${cell}</td>`;
			});
			tr += '</tr>';
			body.innerHTML += tr;
		});
		if( !isPlaceholder ){
			outputData.value = lines.join( "\n" );
		}
		else {
			outputData.value = result
				.filter( row => row.isPlaceholder || row.values.some( v => v !== "0" ) )
				.map( row => row.values.join( ";" ) )
				.join( "\n" );
		}
	}
	format( rawData, isQTY, isSKU, isPrice ){
		rawData = rawData.trim().replace( /&#10;/g, "\n" );
		const rawArray = rawData.split( "\n" );
		const data = [];
		let error = null;
		for( let i = 0; i < rawArray.length; i++ ){
			let raw = rawArray[i].trim();
			if( raw === "" ){
				const tmp = [];
				if( isSKU ) tmp.push( "0" );
				if( isQTY ) tmp.push( "0" );
				if( isPrice ) tmp.push( "0" );
				data.push( { values: tmp, isPlaceholder: true } );
				continue;
			}

			let parts = raw.split( /\s+/ );
			if( parts.length < 3 ){
				error = `Error in row ${i + 1}: too less values.`;
				break;
			}
			parts.pop();
			let sku = parts[0];
			let qty = parts[parts.length - 2]?.replace( '.', ',' ) || "0";
			let price = parts[parts.length - 1]?.replace( '.', ',' ) || "0";
			if( isNaN( qty.replace( ',', '.' ) ) || isNaN( price.replace( ',', '.' ) ) ){
				error = `Incorrect numbers in line ${i + 1}`;
				break;
			}
			const tmp = [];
			if( isSKU ) tmp.push( sku );
			if( isQTY ) tmp.push( qty );
			if( isPrice ) tmp.push( price );
			data.push( { values: tmp, isPlaceholder: false } );
		}
		//if (data.length > 0) data.pop();
		return { data, error };
	}
	clear(){
		this.html.inputData.value = '';
		this.html.outputData.value = '';
		this.html.errorOutput.textContent = '';
		this.html.tableHeader.innerHTML = '';
		this.html.tableBody.innerHTML = '';
		this.html.showSKU.checked = false;
		this.html.showQTY.checked = false;
		this.html.showPrice.checked = true;
		this.html.showPlaceholder.checked = true;
	}
	exportCSV(){
		//doppelcklick sperren
		this.html.buttonExport.disabled = true;
		const data = this.html.outputData.value;
		const blob = new Blob( [data], { type: 'text/csv;charset=utf-8;' } );
		const url = URL.createObjectURL( blob );
		const link = document.createElement( 'a' );
		const now = new Date();
		const dateStr = now.toISOString().slice( 0, 10 );//YYYY-MM-DD
		const timeStr = now.toTimeString().slice( 0, 5 ).replace( ":", "-" );//HH-MM
		const filename = `pricing_data_formatter_${dateStr}_${timeStr}.csv`;
		link.setAttribute( 'href', url );
		link.setAttribute( 'download', filename );
		link.style.display = 'none';
		document.body.appendChild( link );
		link.click();
		document.body.removeChild( link );
		setTimeout(() => {
			this.html.buttonExport.disabled = false;
		}, 1000 );
	}
}