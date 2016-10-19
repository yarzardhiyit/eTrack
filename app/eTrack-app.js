var def_tr_html = '<div class="centered_text"><br /><br /><img src="//cdn2.hubspot.net/hubfs/518742/images/220-s.gif" alt="loading..."></div>';
function getServiceURL( track ){
	return "https://api.pactrak.com/ibcairbill/track/"+track;
}
function startTrackFunction( trackNum ){
	$( "#content" ).hide().html( def_tr_html ).fadeIn();
	$.getJSON( getServiceURL( trackNum ), {} )
		.done(function( json ) {
			try{
				$("#content" ).html( presentHTML( json, trackNum ) );
			}catch( err ){
				console.log( err );
				$("#content" ).html( err.message +" ( 703 )" );
			}
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
					$("#content" ).html( presentHTML( prof, trackNum, true ) );
				}catch( err ){
					console.log( err );
					$("#content" ).html( er.message +" ( 702 )" );
				}
			}
		}
	);
}
function presentHTML( input, trackNum, vendor_error ){
	if (vendor_error === undefined) {
		vendor_error = false;
	} 
	try{
		var sdata = $("<div></div>");
		setupShipmentData( sdata, input.status, input.history, trackNum, vendor_error );
		$("#content").html( sdata );
	}catch( err ){
		throw "Exception producing details: "+err+ "("+JSON.stringify( input )+")"; 
	}
}
function setupShipmentData( tag, status_array, history_array, trackNum, ve ){
	/*  Break appart the JSON structure to display the appropriate data.  */

	/*  Extract Air AMS data. */ 
	var aamsData = $.grep(history_array, function(element, index){
		return element.database === "aams";
	});
	tag.append( $( "<h2></h2>" ).text( "Track: "+trackNum ) );
	
	if( aamsData ){	
		/*  Movement. */ 
		if(  aamsData.length > 0 ){
			
			/*  Air AMS Status */
			if( aamsData[ 0 ].aams_service ){
				tag.append( $("<h5/>").text( "AAMS Service: "+aamsData[ 0 ].aams_service ) ); 
			}
			if( aamsData[ 0 ].aams_status ){
				tag.append( $("<h5/>").text( "AAMS Status: "+aamsData[ 0 ].aams_status ) ); 
			}
			
			var headers = [ "Code", "Station", "Timestamp"];
			tag.append( setupItemTable(  aamsData[ 0 ].report  ,"AAMS", headers ) );
			
			/*  Air AMS messages. */ 
			if( aamsData[ 0 ].aams_report ){
				headers = [ "Code", "Message", "Timestamp"];
				tag.append( setupItemTable(  aamsData[ 0 ].aams_report  ,"AAMS Messages", headers ) );
			}
			/*  Air AMS the history of the disp codes */ 
			if( aamsData[ 0 ].disp_code_history ){
				headers = [ "Code", "Text", "Timestamp"];
				tag.append( setupItemTable(  aamsData[ 0 ].disp_code_history  ,"Disposition History Report", headers ) );
			} 
		}
	}
	tag.append( $("<hr />") );
	
	/* It is possible for multiple entries with the same track number. */ 
	for ( var i in status_array) {
		var ibchist = $("<div></div>");
		var src = status_array[ i ];
		ibchist.append( $( "<h2></h2>" ).text( "Report # "+ i + " for track: "+trackNum ) );
		ibchist.append( $( "<h4></4>" ).text( "Account:"+src.account ) );
		
		/*  Last Disposition Code */ 
		if( src.ibc_code ){
			headers = ["Code", "Date", "Time"];
			var data = [];
			data.push( [ src.ibc_code, src.disp_code_date, src.disp_code_time ] );
			ibchist.append( setUpTable( "Last Disp Code", headers, data ) );
			ibchist.append( "<br />");
		}
		
		/*  POD information  */ 
		if( src.pod_name ){
			headers = ["Name", "Date", "Time"];
			var data = [];
			data.push( [ src.pod_name, src.pod_date, src.pod_time ] );
			ibchist.append( setUpTable("Proof of Delivery" , headers,  data ) );
			ibchist.append( "<br />");
		}
		
		/*  Retrieve the history data for just the specific Item key we are processing */ 
		var returnedData = $.grep(history_array, function(element, index){
			return element.key === src.key;
		});
		
		/*  Display the movement table */ 
		if( returnedData[ 0 ].report ){
			headers = [ "Code", "Station", "Timestamp"];
			ibchist.append( setupItemTable(  returnedData[ 0 ].report  ,"Pactrak Movement", headers ) );
			if( returnedData[ 0 ].movement_time ){
				ibchist.append( $("<h5/>").text( "Movement Time: "+ returnedData[ 0 ].movement_time ) );
			}    
		}
		/*  Display the history of the disp codes */ 
		if( returnedData[ 0 ].disp_code_history ){
			headers = [ "Code", "Text", "Timestamp"];
			ibchist.append( setupItemTable(  returnedData[ 0 ].disp_code_history  ,"Disposition History Report", headers ) );
		}

		/*  Show the service provider and service provider track number */ 
		var sTrak = src.service_track ? " - "+src.service_track : "";
		ibchist.append( $( "<h4></4>" ).text( "Service: "+ src.service_provider + sTrak ) );
		
		/*  Display the vendor info */ 
		var vdata = $("<div></div>");
		vdata.append( $( "<h3></h3>" ).text( "Vendor Information" ) );

		if( ve ){
			vdata.append( $( "<p></p>" ).text( src.vendor_trace ) );
		}else{
			try {
				setupVendorInfo( vdata, JSON.parse( src.vendor_trace )  );
			} catch (e) {
				vdata.append( $( "<p></p>" ).text( src.vendor_trace ) );
			}
		}
		ibchist.append( vdata );
		tag.append( ibchist.append( $("<hr />") ) );
	}
}

function setupItemTable( tableArray, title, headers ){
	var t = $("<b></b>").text( title.toUpperCase() );
	var table = $( "<table class='border corners'></table>" ).append( $( "<caption></caption>" ).append( t ) );
	var tr = $("<tr></tr>");
	for( var i=0; i<headers.length; i++){
		tr.append( $("<th></th>").text( headers[i] ) );
	}
	table.append( tr );
	for( var i = 0; i < tableArray.length; i++ ){
		var ij = tableArray[ i ];
		var tr = $("<tr></tr>");
		table.append( tr.append( $( "<td></td>" ).text(  ij.code ) ).append( $("<td></td>").text( ij.text ) ).append( $("<td></td>").text( ij.timestamp ) ) ); 	
	}
	return $("<div></div>").append( table ).append( "-------------------------------------------");
	
}

function setupVendorInfo( tag, provider ){
	var tbl = $( "<table class='border corners'></table>" );
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
	var table = $("<table class='border corners'></table>");
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
		table.append( $("<tr></tr>").append( $("<td colspan='2'></td>").append( "<hr />" ) ) ); 
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
	var table = $( "<table class='noborder '></table>" ).append( $( "<caption></caption>" ).append( t ) );
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


