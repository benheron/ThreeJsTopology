var camera, scene, renderer;
var cameraControls, effectController;
var clock = new THREE.Clock();

var mouseRay = new THREE.Raycaster();
var mousePos = new THREE.Vector2();
var interMesh;
var interObj;

var clickableObjs = [];

// var canvas2D = document.createElement('canvas');
// var canCon = canvas2D.getContext('2d');


function onMouseMove(event)
{

	var rs = renderer.getSize();

	mousePos.x = (event.clientX / rs.width) *2 - 1;
	mousePos.y = -(event.clientY / rs.height) * 2 + 1;
}

function onMouseClick(event)
{
	if (interMesh)
	{
		detailObject(interMesh);
	}
	//console.log("Mouse X: " + mousePos.x + " Mouse Y: " + mousePos.y);
	//console.log();
	//

	var cameraPos = new THREE.Vector3();
	var quat = new THREE.Quaternion()
	var scale = new THREE.Vector3();


	camera.matrixWorld.decompose(cameraPos, quat, scale);

	//cameraPos.matrixWorld.getPositionFromMatrix(cameraControls);

	//console.log(cameraPos);
}


function detailObject(interObj)
{
	//var objPos = new THREE.Vector3();
	//objPos = interMesh.position.clone();

	var objPos = new THREE.Vector3();
	var quat = new THREE.Quaternion()
	var scale = new THREE.Vector3();

	interObj.matrixWorld.decompose(objPos, quat, scale);
	console.log(objPos);
	
	var asdf = new THREE.Vector3();
	//asdf.setFromMatrixPosition(interMesh.matrix);

	//console.log(asdf);
	var cameraPos = new THREE.Vector3();

	camera.matrixWorld.decompose(cameraPos, quat, scale);

	//console.log(cameraPos);



	var posDiff = new THREE.Vector3().subVectors(objPos, cameraPos);
	// console.log(posDiff);

	//camera.applyMatrix(new THREE.Matrix4().makeTranslation(posDiff.x, 0, posDiff.z));
	//camera.matrix.setPosition(objPos.x, objPos.y, objPos.z);
	//cameraControls.target.set(objPos);

	camera.lookAt(objPos);



}

function makeRouter(xPos, yPos, zPos)
{

	xPos = (xPos === undefined) ? 0 : xPos;
	yPos = (yPos === undefined) ? 0 : yPos;
	zPos = (zPos === undefined) ? 0 : zPos;

	var routerRad = 25;
	var routerHeight = routerRad *4/5;

	

	var routerMat = new THREE.MeshLambertMaterial({color: 0x2075b0, emissiveIntensity: 0.3});
	var routerGeo = new THREE.CylinderGeometry(routerRad, routerRad, routerHeight, 32);

	var routerMesh = new THREE.Mesh(routerGeo, routerMat);

	var router = new THREE.Object3D();
	router.add(routerMesh);

	router.position.set(xPos, yPos, zPos);

	return router;
}


function makeLink(startRouter, endRouter, sendReceive)
{
	//if the router sends and receives data
	//clone router positions to not pass by reference
	var startPosition = new THREE.Vector3();
	startPosition = startRouter.position.clone();

	var endPosition = new THREE.Vector3();
	endPosition = endRouter.position.clone();

	var start = startRouter.clone();
	var end = endRouter.clone();




	//vector representing the linkbody
	var linkBodyAxis = new THREE.Vector3();
	
	
	linkBodyAxis.subVectors(endRouter.position, startRouter.position);
	var linkBodyLength = linkBodyAxis.length();


	//create link body mesh
	var linkMaterial = new THREE.MeshLambertMaterial({color: 0x1F1F1F, opacity: 0.88, transparent: true, emissiveIntensity: 0.5});
	var linkBodyGeo = new THREE.CylinderGeometry(5, 5, linkBodyLength, 32, 1);
	var linkBody = new THREE.Mesh(linkBodyGeo, linkMaterial);

	//the link's centre position
	var linkPos = new THREE.Vector3();
	linkPos = linkBodyAxis.clone();
	linkPos.addVectors(startRouter.position, endRouter.position);
	linkPos.divideScalar(2.0);

	



	//arrow showing direction
	var linkDirBodyLength = 20;
	var linkDirTopLength = 5;

	var linkDirMat = new THREE.MeshLambertMaterial({color: 0xFF0000 });
	var linkDirBodyGeo = new THREE.CylinderGeometry(2, 2, linkDirBodyLength, 32, 1);
	var linkDirTopGeo = new THREE.CylinderGeometry(0, 3, linkDirTopLength, 32, 1);

	var linkDirBody = new THREE.Mesh(linkDirBodyGeo, linkDirMat);
	var linkDirTop = new THREE.Mesh(linkDirTopGeo, linkDirMat);


	//arrow top to the top of the arrow
	linkDirTop.position.y = linkDirBodyLength/2 + linkDirTopLength/2;

	
	//make arrow object
	var linkDir = new THREE.Object3D();

	linkDir.add(linkDirBody);
	linkDir.add(linkDirTop);

	//full link object including arrow
	var linkObjects = new THREE.Object3D();
	linkObjects.add(linkBody);
	linkObjects.add(linkDir);

	var links = new THREE.Object3D();
	links.add(linkObjects);



	transformCylToVector(links, linkBodyAxis, linkPos);

	//use new object so if there's another link it doesn't get
	//transformed by the same matrix as the other link

	

	var linkFinal = new THREE.Object3D();

	var firstLinkContainer = new THREE.Object3D();
	firstLinkContainer.add(links);

	if (sendReceive)
	{
		var secondLinkContainer = new THREE.Object3D();



		var linkBack = makeLink(end, start, false);
		secondLinkContainer.add(linkBack);

	
		var yAxis = new THREE.Vector3(0,1,0);

		var orthVec = new THREE.Vector3();
		orthVec.crossVectors(yAxis, linkBodyAxis);

		orthVec.normalize();

		orthVec.multiplyScalar(5);

		secondLinkContainer.matrixAutoUpdate = false;
		secondLinkContainer.matrix.makeTranslation(orthVec.x, orthVec.y, orthVec.z);
		firstLinkContainer.matrixAutoUpdate = false;
		firstLinkContainer.matrix.makeTranslation(-orthVec.x, -orthVec.y, -orthVec.z);


		linkFinal.add(secondLinkContainer);

	}

	linkFinal.add(firstLinkContainer);


	return linkFinal;
}

function transformCylToVector(obj, vec, position)
{
	obj.matrixAutoUpdate = false;

	vec.normalize();

	obj.matrix.makeTranslation(position.x, position.y, position.z);
	var axisRot = new THREE.Vector3();
	//use y axis as it's a cylinder pointing upwards
	//other axes won't work
	var yAxis = new THREE.Vector3(0,1,0);
	yAxis.normalize();
	axisRot.crossVectors(vec, yAxis);

	if (axisRot.length() == 0)
	{
		axisRot.set(1, 0, 0);
	}
	axisRot.normalize();
	

	//get angle between cylinder and vector
	var cosangle = new THREE.Vector3();
	cosangle = vec.dot(yAxis);

	var angle = -Math.acos(cosangle);

	var matrixRot = new THREE.Matrix4();

	matrixRot.makeRotationAxis(axisRot, angle);
	obj.matrix.multiply(matrixRot);
}


function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );
	$.getJSON("json/topo-16.json", function (data) {

		// LIGHTS
		var ambientLight = new THREE.AmbientLight( 0x222222 );

		var light = new THREE.DirectionalLight( 0xffffff, 1.4 );
		light.position.set( 200, 400, 500 );
		
		var light2 = new THREE.DirectionalLight( 0xffffff, 1.0 );
		light2.position.set( -500, 250, -200 );

		scene.add(ambientLight);
		scene.add(light);
		//scene.add(light2);

		expandTopology(data);
		simplifyTopology(data);

		

		///////////////////////
		////ADD BACKING MAP////
		///////////////////////

		var texture = new THREE.TextureLoader().load( "US-map-cropped-scaled.png" );

		var scale = 2;

		var teWidth = 1153*scale;
		var teHeight = 721*scale;

		var backGeo = new THREE.BoxGeometry(teWidth, 1, teHeight);
		var backMat = new THREE.MeshLambertMaterial({map:texture});

		var backMesh = new THREE.Mesh(backGeo, backMat);

		scene.add(backMesh);
	


		///////////////////////////
		///ADD ROUTERS AND LINKS///
		///////////////////////////
		
	

		//using data values on the texture map
		var latNorth = 50;
		var latSouth = 20;
		var longEast = -65;
		var longWest = -125;


		var latDiff = latNorth - latSouth; //30
		var longDiff = longEast - longWest; //60





		var routers = {};
		var routersArr = [];

		var numRouters = data.topology[0].node.length;


		var mapPixelWidth = 1153;
		var mapPixelHeight = 721;

		var mapSize = new THREE.Vector2(mapPixelWidth, mapPixelHeight);




		// for (var i=0;i<numRouters; i++)
		// {

		// }

		for (var i=0; i<numRouters; i++)
		{
			var xPos = data["topology"][0]["node"][i]["geo-topology:geo-node-attributes"]["longitude"];
			var yPos = 30;
			var zPos = data["topology"][0]["node"][i]["geo-topology:geo-node-attributes"]["latitude"];

			var long = convertLongToX(xPos, longEast, longWest, longDiff, mapPixelWidth, scale);
			var lat = convertLatToZ(zPos, latNorth, latSouth, latDiff, mapPixelHeight, scale);


			lat += 65;

			var newRouter = makeRouter(long, yPos, lat);

			newRouter.name = data["topology"][0]["node"][i]["node-id"];
			newRouter.latLong = new THREE.Vector2(long, lat);
			newRouter.termPoint = [data["topology"][0]["node"][i]["termination-point"]];
			
			//reference router by it's id
			routers[data["topology"][0]["node"][i]["node-id"]] = newRouter;

			//router array as well so we can loop through it
			routersArr[i] = newRouter;


			clickableObjs.push(newRouter);
			scene.add(newRouter);
		}


		var links = [];
		var numLinks = data["topology"][0]["link"].length;

		//clone the links array
		var linkData = data["topology"][0]["link"].slice(0);
		

		//create list of links to use
		for (var i=0; i<numLinks;i++)
		{
			//add temp object
			links[i] = new Array();

			//add link to array
			links[i].push(linkData[i]);
			for (var j=0;j<numLinks;j++)
			{
				//check if source-dest is the same as another link
				//if so add to second links array 
				if ((linkData[i]["destination"]["dest-node"] == linkData[j]["source"]["source-node"]) && (linkData[j]["destination"]["dest-node"] == linkData[i]["source"]["source-node"]))
				{
					//add returned link to array
					links[i].push(linkData[j]);

					//get rid of the returned link from the list
					linkData.splice(j,1);
					numLinks--;
					break;
				}
			}
		}

		//add links to scene
		for (i=0;i<links.length; i++)
		{
			var srcNode = links[i][0]["source"]["source-node"];
			var destNode = links[i][0]["destination"]["dest-node"];

			var linkReturn = false;

			if (links[i][1])
			{
				linkReturn = true;
			}

			var newLink = makeLink(routers[srcNode], routers[destNode], linkReturn);
			clickableObjs.push(newLink);
			scene.add(newLink);
		}

		// clickableObjs.push(links);
		// clickableObjs.push(routers);

		// var texture2 = new THREE.Texture( textAsCanvas("nyc"));
		// texture2.needsUpdate = true;

		// var sprMat = new THREE.SpriteMaterial({map:texture2});
		// var spr = new THREE.Sprite(sprMat);

		// var sprScale = 70;
		// spr.scale.set(sprScale, sprScale, 1);

		// spr.position.set(690, 70, -187);
		

		// scene.add(spr);



		for (var i = 0; i<numRouters;i++)
		{
			var routerName = new THREE.Texture(textAsCanvas(routersArr[i].name));
			routerName.needsUpdate = true;

			var sprMat = new THREE.SpriteMaterial({map:routerName});
			var spriteText = new THREE.Sprite(sprMat);

			var sprScale = 70;

			spriteText.scale.set(sprScale, sprScale, 1);

			spriteText.position.set(routersArr[i].latLong.x, 70, routersArr[i].latLong.y);
			scene.add(spriteText);
		}

	});
}

function textAsCanvas(canvasText)
{
	var canvas = document.createElement('canvas');
	canvas.width = 2048;
	canvas.height = 1024;

	var context = canvas.getContext('2d');
	context.font = 'bold 700px Arial';
	context.textAlign = 'center';
	context.textBaseline = 'middle';

	context.fillStyle = 'black';
	// context.strokeStyle = 'black';

	context.lineWidth = 60;

	context.fillText(canvasText, canvas.width/2, canvas.height/2);
	// context.strokeText(canvasText, canvas.width/2, canvas.height/2);

	return canvas;
}

function expandTopology(topology)
{

	topology["topology"][0]["topology-id"] = "expanded-topology";

	var dataTwoLinks = topology["topology"][0]["link"];

	var dataTwoNodes = topology["topology"][0]["node"];

	var twoToSixLinks = [];


	var topLinks = [];
	var linkData = dataTwoLinks;
	
	for (i=0;i<dataTwoLinks.length;i++)
	{	

		var linkID = {};
		
		var linkidsplit = dataTwoLinks[i]["link-id"].split("&");

		for (j=0;j<linkidsplit.length;j++)
		{
			var splitdata = linkidsplit[j].split("=");
			linkID[splitdata[0]] = splitdata[1];
		}

		linkData[i]["link-id"] = linkID;

		var destination = {};
		var destNode = {};


		var destNSplit = dataTwoLinks[i]["destination"]["dest-node"].split("&");

		for (j=0;j<destNSplit.length;j++)
		{
			var splitdata = destNSplit[j].split("=");
			destNode[splitdata[0]] = splitdata[1];
		}

		destination["dest-node"] = destNode;

		var destTP = {};
		var destTPSplit = dataTwoLinks[i]["destination"]["dest-tp"].split("&");

		var destTSplit = dataTwoLinks[i]["destination"]["dest-tp"].split("&");

		for (j=0;j<destTPSplit.length;j++)
		{
			var splitdata = destTPSplit[j].split("=");
			destTP[splitdata[0]] = splitdata[1];
		}

		destination["dest-tp"] = destTP;

		// topLinks[i]["destination"]["dest-tp"] = destTP;

		linkData[i]["destination"] = destination;

		var source = {};
		var sourceTP = {};

		var sourceTPSplit = dataTwoLinks[i]["source"]["source-tp"].split("&");

		for (j=0;j<sourceTPSplit.length; j++)
		{
			var splitdata = sourceTPSplit[j].split("=");
			sourceTP[splitdata[0]] = splitdata[1];
		}

		source["source-tp"] = sourceTP;


		var sourceNode = {};
		var sourceNSplit = dataTwoLinks[i]["source"]["source-node"].split("&");

		for (j=0;j<sourceNSplit.length;j++)
		{
			var splitdata = sourceNSplit[j].split("=");
			sourceNode[splitdata[0]] = splitdata[1];
		}

		source["source-node"] = sourceNode;

		linkData[i]["source"] = source;




		linkData[i]["l3-unicast-igp-topology:igp-link-attributes"] = dataTwoLinks[i]["l3-unicast-igp-topology:igp-link-attributes"];

		topLinks.push(linkData);
	}

	var nodeData=dataTwoNodes;

	for (i=0;i<dataTwoNodes.length;i++)
	{
		var nodeID ={};

		var nodeidsplit = dataTwoNodes[i]["node-id"].split("&");

		for (var j=0;j<nodeidsplit.length;j++)
		{
			var splitdata = nodeidsplit[j].split("=");
			nodeID[splitdata[0]] = splitdata[1];
		}
		nodeData[i]["node-id"] = nodeID;


		var terminationPoint = [{}];

		var tpID = {};

		var tpIDsplit = dataTwoNodes[i]["termination-point"][0]["tp-id"].split("&");

		for (var j=0;j<tpIDsplit.length;j++)
		{
			var splitdata = tpIDsplit[j].split("=");
			tpID[splitdata[0]] = splitdata[1];
		}
		terminationPoint[0]["tp-id"] = tpID;
		terminationPoint[0]["l3-unicast-igp-topology:igp-termination-point-attributes"] = dataTwoNodes[i]["termination-point"][0]["l3-unicast-igp-topology:igp-termination-point-attributes"];

		nodeData[i]["termination-point"] = terminationPoint;
	}
}

function simplifyTopology (exTop)
{
	exTop["topology"][0]["topology-id"] = "router-topology";

	var etLinks = exTop["topology"][0]["link"];
	var etNodes = exTop["topology"][0]["node"];

	for (var i=0; i<etLinks.length; i++)
	{

		var linkid = etLinks[i]["link-id"]["ipv4-iface"] + "_to_" + etLinks[i]["link-id"]["ipv4-neigh"];
		var source;
		var dest;

		var destNode = etLinks[i]["destination"]["dest-node"];
		var sourceNode = etLinks[i]["source"]["source-node"];
		for (j=0; j<etNodes.length;j++)
		{
			var nodeCompare = etNodes[j]["node-id"];

			if (destNode["router"] == nodeCompare["router"])
			{
				dest = etNodes[j]["l3-unicast-igp-topology:igp-node-attributes"]["name"];
			}

			if (sourceNode["router"] == nodeCompare["router"])
			{
				source = etNodes[j]["l3-unicast-igp-topology:igp-node-attributes"]["name"];
			}
		}

		etLinks[i]["link-id"] = linkid;

		etLinks[i]["destination"]["dest-node"] = dest;
		etLinks[i]["destination"]["dest-tp"] = etLinks[i]["destination"]["dest-tp"]["ipv4"];

		etLinks[i]["source"]["source-node"] = source;
		etLinks[i]["source"]["source-tp"] = etLinks[i]["source"]["source-tp"]["ipv4"];

		delete etLinks[i]["l3-unicast-igp-topology:igp-link-attributes"];
	}
	
	for (var i=0; i<etNodes.length; i++)
	{
		var nodeid = etNodes[i]["l3-unicast-igp-topology:igp-node-attributes"]["name"];
		delete etNodes[i]["l3-unicast-igp-topology:igp-node-attributes"];
		delete etNodes[i]["termination-point"][0]["l3-unicast-igp-topology:igp-termination-point-attributes"];

		var termPoint = etNodes[i]["termination-point"][0]["tp-id"]["ipv4"];

		etNodes[i]["node-id"] = nodeid;
		etNodes[i]["termination-point"][0]["tp-id"] = termPoint;
	}
}

function convertLongToX(longitude, longEast, longWest, longDiff, mapWidth, scale)
{
	var longX = (-(longEast-longitude)/longDiff) * (mapWidth*scale);
	longX += (mapWidth*scale)/2;
	return longX;
}

function convertLatToZ(latitude, latNorth, latSouth, latDiff, mapHeight, scale)
{
	var latZ = ((latNorth-latitude)/latDiff) * (mapHeight*scale);
	latZ -= (mapHeight*scale)/2;
	return latZ;
}

function init() {
    // var canvasWidth = 846;
    // var canvasHeight = 494;

    var canvasWidth = window.innerWidth;
    var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER

	var canvas3d = document.getElementById('can3d');

	renderer = new THREE.WebGLRenderer( { antialias: true, canvas: canvas3d } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor(new THREE.Color(0xAAAAAA, 1.0));

	// CAMERA
	camera = new THREE.PerspectiveCamera( 45, canvasRatio, 1, 10000 );
	camera.applyMatrix(new THREE.Matrix4().makeTranslation(0, 1800, 0));
	camera.applyMatrix(new THREE.Matrix4().makeRotationY(0));
	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	cameraControls.target.set(0, 0,0);

	cameraControls.minPolarAngle = -Math.PI;
	cameraControls.maxPolarAngle = Math.PI/180 * 70;


}

function addToDOM() {
    var container = document.getElementById('container');
    //var canvas = container.getElementsByTagName('canvas');
    container.appendChild(renderer.domElement);

	//2D canvas

	// canvas2D.id = "can2d";
	// canvas2D.width = window.innerWidth;
	// canvas2D.height = window.innerHeight;
	// canCon.font = "30px Arial";
	// var te = "Foo bar";
	// canCon.fillText(te,10,50);

	// container.appendChild(canvas2D);






}

function animate() {
	window.requestAnimationFrame(animate);
	render();
}

function render() {
	scene.updateMatrixWorld();
	var delta = clock.getDelta();
	cameraControls.update(delta);
	camera.updateMatrixWorld();

	mouseRay.setFromCamera(mousePos, camera);

	var intersects = mouseRay.intersectObjects(clickableObjs, true);

	//if there is an intersect
	if (intersects.length > 0)
	{
		//if the intersect is not the previous intersect
		if (interMesh != intersects[0].object)
		{
			//if exists, change back to normal
			if (interMesh)
			{
				interMesh.material.emissive.setHex(0x000000);
			}

			//change intersect value and change colour
			interMesh = intersects[0].object;
			interMesh.material.emissive.setHex(0xFFFFFF);
			interObj = intersects[0];
		}
	} else {
		if (interMesh)
		{
			interMesh.material.emissive.setHex(0x000000);
		}
		interMesh = null;
		interObj = null;

	}


	
	
	renderer.render(scene, camera);
}

function setUpEvents() {
	window.addEventListener('mousemove', onMouseMove, false);
	window.addEventListener('click', onMouseClick, false);
}

try {
  init();
  setUpEvents();
  fillScene();
  addToDOM();
  animate();
} catch(e) {
    var errorReport = "Your program encountered an unrecoverable error, can not draw on canvas. Error was:<br/><br/>";
    $('#container').append(errorReport+e);
}
