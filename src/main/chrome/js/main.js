
//event listeners
window.addEventListener("load",loadStatus);
$('#force-refresh').click(function(){
	chrome.storage.sync.get(['apikey','cid'], function(items){_loadStatus(items)});
});
$('#edit-settings').click(function(){
	window.location = "../options/index.html";
});

$('body').on("click","button[id*='control-']",function(evt){togglePower(evt);});
$('body').on("click","button[id*='info-']",function(evt){info(evt);});



//vars
var loadingHtml = '<img src="../../icons/ajax-loader.gif" alt="Loading" />';
var serverIdMap = {};
//take a get detailed info about a server
function info(evt)
{

	var nodeId = evt.target.id.replace("info-","");
	

	if($('#info-display-'+nodeId).contents().length != 0)
	{
		console.log("not empty?");
		$('#info-display-'+nodeId).empty();
		$('#info-'+nodeId).empty();
		$('#info-'+nodeId).append('<span class="glyphicon glyphicon-info-sign"></span>Info');
		return;

	}
	
	

	chrome.storage.sync.get(['apikey','cid'], function(items)
	{
	
		var apikey = items.apikey;
		var clientId = items.cid;
		var infoUrl = "https://"+clientId+":"+apikey+"@dropzone.singlehop.com/server/view/"+nodeId;
		$('#info-'+nodeId).empty();
		$('#info-'+nodeId).append(loadingHtml);
		console.log(infoUrl);
		$.getJSON( infoUrl, function( data ) 
		{
		
			var serverInfo = '';
			
			var displayId = '';
			$.each(data.data, function(key, val){

				serverInfo += '<li class="list-group-item">'+key+': '+val+"</li>";
				if(key == "hostname")
				{
					displayId = serverIdMap[val];
				}

			});
			
			
			$('#info-display-'+displayId).append(serverInfo);
			$('#info-'+displayId).empty();
			$('#info-'+displayId).append('<span class="glyphicon glyphicon-info-sign"></span>Click to Close');
			console.log(displayId);
			console.log(serverInfo);
		});
	});
}

function getServer(id)
{
	var servers = JSON.parse(localStorage.getItem("statusData")).data;
	return servers[id];
}

function togglePower(evt)
{
	var id = evt.target.id.replace("control-","");
	var server= getServer(id);

	if(server.status == "online")
	{
		console.log("stopping server "+id);
		_turnOff(id);
	}
	else
	{
		console.log("starting server "+id);
		_turnOn(id);
	}


	
}

function _loadStatus(settings)
{
	var apikey = settings.apikey;
	var clientId = settings.cid;
	

			//redirect to settings page
	if(apikey == undefined || clientId == undefined)
	{
		window.location = "../options/index.html";
	}

	
	var statusUrl = "https://"+clientId+":"+apikey+"@dropzone.singlehop.com/server/list";
	$('#loading').append('<p>Loading... <img src="../../icons/ajax-loader.gif" alt="Loading" /></p>');
	$.getJSON( statusUrl, function( data ) 
	{		
		console.log("loading server status");			
  		localStorage.setItem("loaded",new Date().getTime());
  		localStorage.setItem("statusData",JSON.stringify(data));
  		updateStatus();
	});		

}

function _turnOn(id)
{
	
	chrome.storage.sync.get(['apikey','cid'], function(items){

		var apikey = items.apikey;
		var clientId = items.cid;	
 		var startUrl = "https://"+clientId+":"+apikey+"@dropzone.singlehop.com/server/startvm/"+id;
		$('#control-'+id).empty();
		$('#control-'+id).append(loadingHtml);	

		$.getJSON( startUrl, function( data ) 
		{		
			console.log(data);  		
			if(data.success)
			{
				$('#control-'+id).empty();
				$('#control-'+id).removeClass("btn-success").addClass("btn-warning");
				$('#control-'+id).append('<span class="glyphicon glyphicon-stop"></span>Turn Off');	

		}
	});	
	});	
}

function _turnOff(id)
{

	chrome.storage.sync.get(['apikey','cid'], function(items){

		var apikey = items.apikey;
		var clientId = items.cid;


 		var startUrl = "https://"+clientId+":"+apikey+"@dropzone.singlehop.com/server/stopvm/"+id;
		$('#control-'+id).empty();
		$('#control-'+id).append(loadingHtml);	

		$.getJSON( startUrl, function( data ) 
		{		
			console.log(data);  		
			if(data.success)
			{
				$('#control-'+id).empty();
				$('#control-'+id).removeClass("btn-warning").addClass("btn-success");
				$('#control-'+id).append('<span class="glyphicon glyphicon-play"></span>Turn On');	
		}
	});	
	});
}

function updateStatus(){

		console.log("rendering table...");
		var servers = JSON.parse(localStorage.getItem("statusData")).data;

		var serverList = '<div class="row"><div class="list-group">';
				
  		$.each(servers,function(index, server)
  		{
  			//keep map of hostname to ID because singlehop returns the hypervisior ID for VMs (at least when you request details)
  			serverIdMap[server.hostname] = server.serverid;

  			var serverControl = "";
  			serverList +='<div class="list-group-item"><p>'+server.hostname+'</p>';

			if(server.status == "online")
			{
				
	  			if(server.type == "vm")
  				{
  					serverControl += '<button type="button" class="btn btn-xs btn-warning" id="control-'+server.serverid+'"><span class="glyphicon glyphicon-stop"></span>Turn Off</button>';									
  				}
			}
			else
			{
				
				if(server.type == "vm")
  				{
					serverControl += '<button type="button" class="btn btn-xs btn-success" id="control-'+server.serverid+'"><span class="glyphicon glyphicon-play"></span>Turn On</button>';
				}
			}	
			serverControl += '<button type="button" class="btn btn-xs btn-info" id="info-'+server.serverid+'"><span class="glyphicon glyphicon-info-sign"></span>Info</button>';

  			serverList += serverControl+'<ul class="list-group" id="info-display-'+server.serverid+'"></ul></div>';
  			
  		});
  		
		$('#status-content').empty();
		$('#status-content').append(serverList);
		$('#loading').empty();
		
	}
	

 
  


function loadStatus()
{
	chrome.storage.sync.get(
    ['updatefreq'], function(itemz) {

	console.log("checking last load time...");
	var now = new Date().getTime();
	//convert to miliseconds
	var freq = itemz.updatefreq * 60000;

	if(localStorage.getItem("loaded") === undefined )	
	{
		console.log("loaded is undef -- updating server statuses");
		chrome.storage.sync.get(['apikey','cid'], function(items){_loadStatus(items)});
	}
	else if ((now - localStorage.getItem("loaded")) > freq)
	{
		console.log("loaded is def but is out of date -- updating server statuses");
		chrome.storage.sync.get(['apikey','cid'], function(items){_loadStatus(items)});
	}
	else{
		console.log("info is up to date...rendering table");
		updateStatus();
		}	
	});
}
 