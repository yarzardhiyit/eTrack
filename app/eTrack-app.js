var def_tr_html = '<div class="centered_text"><br /><br /><img src="//cdn2.hubspot.net/hubfs/518742/images/220-s.gif" alt="loading..."></div>';
function getServiceURL( track ){
	return "https://api.pactrak.com/ibcairbill/track/"+track;
}
function startTrackFunction( trackNum ){
	$( "#content" ).hide().html( def_tr_html ).fadeIn();
	$.getJSON( getServiceURL( trackNum ), {} )
		.done(function( json ) {
			$("#content" ).html( presentHTML( json ) );
		})
		.fail(function( jqxhr, textStatus, error ) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err );
			var er = JSON.parse( jqxhr.responseText );
			var prof = JSON.parse( er.profile );

			if( $.isEmptyObject( prof )){
				$("#content" ).html( er.message +" ( 701 )" );
			}else{
				try{
					$("#content" ).html( presentHTML( prof, true ) );
				}catch( err ){
					console.log( err );
					$("#content" ).html( er.message +" ( 702 )" );
				}
			}
		}
	);
}
function presentHTML( input, vendor_error ){
	if (vendor_error === undefined) {
		vendor_error = false;
	} 
	try{
		var sdata = $("<div></div>");
		setupShipmentData( sdata, input.status );
		var ibchist = $("<div></div>");
		setupIBCHistory( ibchist, input.history );
		ibchist.append( $("<hr />") );
		var vdata = $("<div></div>");
		if( vendor_error ){
			vdata.append( $( "<h3></h3>" ).text( "Vendor Information" ) );
			vdata.append( $( "<p></p>" ).text( input.vendor_trace ) );
		}else{
			setupVendorInfo( vdata, JSON.parse( input.vendor_trace )  );
		}
		//console.log( JSON.stringify( input ) );
		$("#content").html( sdata ).append( ibchist, vdata );
	}catch( err ){
		throw "Exception producing details: "+err; 
	}
}
function setupShipmentData( tag, src ){	
	tag.append( $( "<h3></h3>" ).text( "IBC Information" ) );
	if( src.ibc_code ){
		var headers = ["Code", "Date", "Time"];
		var data = [];
		data.push( [ src.ibc_code, src.disp_code_date, src.disp_code_time ] );
		tag.append( setUpTable( "DISP", headers, data ) );
	}
	if( src.pod_name ){
		var headers = ["Name", "Date", "Time"];
		var data = [];
		data.push( [ src.pod_name, src.pod_date, src.pod_time ] );
		tag.append( setUpTable("POD" , headers,  data ) );	
	}
	tag.append( $( "<h4></4>" ).text( "Service: "+ src.service_provider + " - "+src.service_track ) );
}
function setupIBCHistory( tag, srcarray ){
	for( var i = 0; i < srcarray.length; i++ ){
		tag.append( setupIBCHistoryItem( srcarray[ i ] ) );
	}
}
function setupIBCHistoryItem( json ){
	var t = $("<b></b>").text( json.database.toUpperCase() );
	var table = $( "<table></table>" ).append( $( "<caption></caption>" ).append( t ) );
	table.append( $("<tr></tr>").append( "<th>Code</th><th>Timestamp</th><th>Station</th>" ) );
	for( var i = 0; i < json.report.length; i++ ){
		var ij = json.report[ i ];
		var tr = $("<tr></tr>");
		table.append( tr.append( $( "<td></td>" ).text(  ij.code ) ).append( $("<td></td>").text( ij.timestamp ) ).append( $("<td></td>").text( ij.station ) ) ); 	
	}
	return $("<div></div>").append( table );
}

function setupVendorInfo( tag, provider ){
	tag.append( $( "<h3></h3>" ).text( "Vendor Information" ) );
	var tbl = $( "<table></table>" );
	var svc = provider.service;
	tbl.append( $("<tr></tr>").append( $("<td></td>").text( "Service Code: " ) ).append( $("<td></td>").text( svc.carrier_code ) ) );
	tbl.append( $("<tr></tr>").append( $("<td></td>").text( "Track: " ) ).append( $("<td></td>").text( svc.trackNumber ) ) );
	if( svc.carrier_service ){
		tbl.append( $("<tr></tr>").append( $("<td></td>").text( "Service: " ) ).append( $("<td></td>").text( svc.carrier_service ) ) );	
	}
	if( svc.carrier_service_description ){
		tbl.append( $("<tr></tr>").append( $("<td></td>").text( "Service Description: " ) ).append( $("<td></td>").text( svc.carrier_service_description ) ) );	
	}
	if( svc.delivery_signature ){
		tbl.append( $("<tr></tr>").append( $("<td></td>").text( "Signed By: " ) ).append( $("<td></td>").text( svc.delivery_signature ) ) );	
	}
	if( svc.delivery_timestamp ){
		tbl.append( $("<tr></tr>").append( $("<td></td>").text( "Delivery Time: " ) ).append( $("<td></td>").text( svc.delivery_timestamp ) ) );	
	}
	if( svc.delivery_code ){
		tbl.append( $("<tr></tr>").append( $("<td></td>").text( "Delivery Code: " ) ).append( $("<td></td>").text( svc.delivery_code ) ) );	
	}
	if( svc.delivery_details ){
		tbl.append( $("<tr></tr>").append( $("<td></td>").text( "Details: " ) ).append( $("<td></td>").text( svc.delivery_details ) ) );	
	}
	tag.append( tbl );
	var evts = $("<div></div>");
	setupVendorEvents( evts, provider.events );
	tag.append( evts );
}
function setupVendorEvents( tag, evtarray ){
	tag.append( $( "<h3></h3>" ).text( "Vendor Events" ) );
	var table = $("<table></table>");
	var tr;
	for( var i = 0; i<evtarray.length; i++ ){
		var evt = evtarray[ i ];
		tr = $("<tr></tr>");
		var td1 = $("<td valign='top'></td>").append( propTable( "Event # "+( i+1)  , ["Timestamp", "Type" ,"Code", "Description", "Station"],
			[ evt.timestamp, evt.type, evt.status_code, evt.status_description, evt.station ]  ) );
		var addr = evt.address;
		var td2 = $("<td valign='top'></td>").append( propTable( "Address", [ "Country", "City", "State", "Postal Code", "Type" ],
			[ addr.country, addr.city, addr.state, addr.zip, addr.type ] ) );
		table.append( tr.append( td1 ).append( td2 ) );
		if( evt.event_description ){
			tr = $("<tr></tr>").append( $("<td colspan='2'></td>").append( $("<b></b>").text( evt.event_description ) ) );
			table.append( tr );
		}
		table.append( $("<tr></tr>").append( $("<td colspan='2'></td>").append( $("<hr />") ) ) ); 
	}
	tag.append(  table );
}

//var xx = [[]];  xx[0][1] = 5;
function setUpTable( caption, headers, data ){
	var t = $("<b></b>").text( caption.toUpperCase() );
	var table = $( "<table></table>" ).append( $( "<caption></caption>" ).append( t ) );
	var tr = $("<tr></tr>");
	for( var i=0; i<headers.length; i++){
		tr.append( $("<th></th>").text( headers[i] ) );
	}
	table.append( tr );
	var td;
	for( var x=0; x<data.length; x++){
		tr = $("<tr></tr>");
		var r = data[ x ];
		for( var y=0; y < r.length; y++){
			tr.append( $("<td></td>").text( r[ y ] ) );
		}
		table.append( tr );
	}
	return $("<div></div>").append( table );
}

function propTable( caption, headers, data ){
	var t = $("<b></b>").text( caption.toUpperCase() );
	var table = $( "<table></table>" ).append( $( "<caption></caption>" ).append( t ) );
	for( var i = 0; i < headers.length; i++){
		if( data[ i ] ){
			table.append( $("<tr></tr>").append( $("<td></td>").text( headers[i] ) ).append( $("<td></td>").text(data[ i ]) ) )
		}
	}
	return table;
}

function GetEncodedURLParameter( sParam ){
	var sPageURL = window.location.search.substring( 1 );
	var sURLVariables = sPageURL.split( '&' );
	for ( var i = 0; i < sURLVariables.length; i++ ){
		var sParameterName = sURLVariables[i].split( '=' );
		if ( sParameterName[ 0 ] === sParam ){
			return decodeURIComponent( sParameterName[ 1 ] );
		}
	}
}
			
$(function(){
	var reqTrak = GetEncodedURLParameter( "track" );
	if( reqTrak ){
		startTrackFunction( reqTrak );
	}

	$( "#load_trk" ).click( function(){
		startTrackFunction( $(this).prev( "input" ).val().trim() );
	});
	$( "#reset_req" ).click( function(){
		$("#content").hide("slow","swing", function(){
			$(this).html( def_tr_html );
			$( "#trk" ).val('');
		});

	});
});


