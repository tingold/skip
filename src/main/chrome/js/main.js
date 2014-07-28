//global settings object -- fuck this callback shit
var shSettings = {};
//event listeners
window.addEventListener("load",loadStatus);
$('#force-refresh').click(function(){
	chrome.storage.sync.get(['apikey','cid'], function(items){_loadStatus(items)});
});
$('body').on("click","button[id*='control-']",function(evt){togglePower(evt);});
$('body').on("click","button[id*='snapshot-']",function(evt){snapshot(evt);});
$('body').on("click","button[id*='ssh-']",function(evt){ssh(evt);});

//update global settings if something changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (key in changes) 
        {
          if(key == 'apikey' || key == 'cid')
          {
          	shSettings[key] = changes[key].newValue;
          }  
        }
      });

//meat of the code...

//vars
var loadingHtml = '<img src="../../icons/ajax-loader.gif" alt="Loading" />';

//take a snapshot of a vm
function snapshot(evt)
{
	console.log(evt);

}
function getServer(id)
{
	var servers = JSON.parse(localStorage.getItem("statusData")).data;
	return servers[id];
}


function ssh(evt)
{
	var id = evt.target.id.replace("ssh-","");
	var server= getServer(id);
	console.log(server);


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

		var serverInfo = '<div class="row"><div class="list-group">';
		var clickListners = [];
		
  		$.each(servers,function(index, server)
  		{
  			
  			var serverControl = "";
  			serverInfo +='<div class="list-group-item"><p>'+server.hostname+'</p>';

			if(server.status == "online")
			{
				 //serverInfo = '<div class="alert alert-success" id="'+server.serverid+'">'+server.hostname;
	  			if(server.type == "vm")
  				{
  					serverControl += '<button type="button" class="btn btn-xs btn-warning" id="control-'+server.serverid+'"><span class="glyphicon glyphicon-stop"></span>Turn Off</button>';					
  					serverControl += '<button type="button" class="btn btn-xs btn-info" id="ssh-'+server.serverid+'"><span class="glyphicon glyphicon-resize-vertical"></span>SSH</button>';
  					//serverControl += serverControl += '<button type="button" class="btn btn-xs btn-success" id="snaphot-'+server.serverid+'"><span class="glyphicon glyphicon-camera"></span> Snapshot</button>';
  				}
			}
			else
			{
				//serverInfo = '<div class="alert alert-warning" id="'+server.serverid+'">'+server.hostname;
				if(server.type == "vm")
  				{
					serverControl += '<button type="button" class="btn btn-xs btn-success" id="control-'+server.serverid+'"><span class="glyphicon glyphicon-play"></span>Turn On</button>';
					//serverControl += '<button type="button" class="btn btn-xs btn-success" id="snaphot-'+server.serverid+'"><span class="glyphicon glyphicon-camera"></span> Snapshot</button>';
				}
			}	

  			serverInfo += serverControl+'</div>';
  			
  		});
  		
		$('#status-content').empty();
		$('#status-content').append(serverInfo);
		$('#loading').empty();
		
	}
	

 
  


function loadStatus()
{
	console.log("checking last load time...");
	var now = new Date().getTime();
	console.log("time now is "+now);
	console.log("Stored  time is "+localStorage.getItem("loaded"));
	console.log("difference is "+(now-localStorage.getItem("loaded")));

	if(localStorage.getItem("loaded") === undefined )	
	{

		console.log("loaded is undef -- updating server statuses");
		chrome.storage.sync.get(['apikey','cid'], function(items){_loadStatus(items)});
	}
	else if ((now - localStorage.getItem("loaded")) > 600000)
	{
		console.log("loaded is def but is out of date -- updating server statuses");
		chrome.storage.sync.get(['apikey','cid'], function(items){_loadStatus(items)});
	}
	else{
		console.log("info is up to date...rendering table");
		updateStatus();
		
	}
 	
}