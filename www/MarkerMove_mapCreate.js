// This is a JavaScript file
var initZoom = 14                       ; // ズームの初期値
var MinZoom  = 1                        ; // ズームの最小値（最も広い範囲）
var MaxZoom  = 20                       ; // ズームの最大値（最も狭い範囲）
// ***********************************************************************
var CheckActionNo = 1                   ; // 選択 ActionNo
var picName = "iCon/HeadingLarge.gif"   ; // 表示 Marker名
var MarkerID = 0                        ; // MarkerID
var center_lon = 135.100303888          ; // 中心の経度（須磨浦公園）
var center_lat = 34.637674639           ; // 中心の緯度（須磨浦公園）
var Heading;
var Speed;
    
// click 状況
$(function(){
    $( 'input[name="myRadio"]:radio' ).change( function() {
      var radioval = $(this).val();
      //PicName = "iCon/" + ActionPictures[radioval];
      CheckActionNo = radioval;
    });
});

    // 表示用の view 変数の定義。
    var view;
    // 情報プロットレイヤーの定義
    var vectorLayer = new ol.layer.Vector({ source: new ol.source.Vector() });
    // cyberJ（地理院地図）用の変数
    var cyberJ = new ol.layer.Tile({
        opacity: 0.95,
        source: new ol.source.XYZ({
          attributions  : [ new ol.Attribution({ html: "<a href='http://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>" }) ],
          url           : "http://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
          projection    : "EPSG:3857"
        })
    });
    // 地図変数 (map 変数) の定義（地理院地図を表示するように指定）
    var map
    
function GetPosition(){
    //navigator.geolocation.getCurrentPosition(onSuccess, onError);//watchPosition
    navigator.geolocation.watchPosition(onSuccess, onError);
}

//--------------------------------------------------------------------
function init_map(Latitude,Longitude,Heading,Speed) {// click 状況
    // Define a namespace for the application.
    var app = {};


    // @constructor
    // @extends {ol.interaction.Pointer}
    app.Drag = function() {
        ol.interaction.Pointer.call(this, {
          handleDownEvent: app.Drag.prototype.handleDownEvent,
          handleDragEvent: app.Drag.prototype.handleDragEvent,
          handleMoveEvent: app.Drag.prototype.handleMoveEvent,
          handleUpEvent: app.Drag.prototype.handleUpEvent
        });
        // @type {ol.Pixel}
        // @private
        this.coordinate_ = null;
        // @type {string|undefined}
        // @private
        this.cursor_ = 'pointer';
        // @type {ol.Feature}
        // @private
        this.feature_ = null;
        // @type {string|undefined}
        // @private
        this.previousCursor_ = undefined;
    };
      
    ol.inherits(app.Drag, ol.interaction.Pointer);
      
    // @param {ol.MapBrowserEvent} evt Map browser event.
    // @return {boolean} `true` to start the drag sequence.
    app.Drag.prototype.handleDownEvent = function(evt) {
        var map = evt.map;
        var feature = map.forEachFeatureAtPixel(evt.pixel,
            function(feature) {
              return feature;
            });
        if (feature) {
            this.coordinate_ = evt.coordinate;
            this.feature_ = feature;
            // Drag開始表示 ---
            var Action = document.getElementById('action');
            Action.insertAdjacentHTML('afterbegin','Move');
            // ----------------
        }
        return !!feature;
    };
      
    // @param {ol.MapBrowserEvent} evt Map browser event.
    app.Drag.prototype.handleDragEvent = function(evt) {
        // MoveStart -> 表示消去
        $("#action").empty();
        // ---------------------
        var deltaX = evt.coordinate[0] - this.coordinate_[0];
        var deltaY = evt.coordinate[1] - this.coordinate_[1];
        var geometry = this.feature_.getGeometry();
        geometry.translate(deltaX, deltaY);
        this.coordinate_[0] = evt.coordinate[0];
        this.coordinate_[1] = evt.coordinate[1];
    };
      
    // @param {ol.MapBrowserEvent} evt Event.
    app.Drag.prototype.handleMoveEvent = function(evt) {
        if (this.cursor_) {
          var map = evt.map;
          var feature = map.forEachFeatureAtPixel(evt.pixel,
              function(feature) {
                return feature;
              });
          var element = evt.map.getTargetElement();
          if (feature) {
            if (element.style.cursor != this.cursor_) {
              this.previousCursor_ = element.style.cursor;
              element.style.cursor = this.cursor_;
            }
          } else if (this.previousCursor_ !== undefined) {
            element.style.cursor = this.previousCursor_;
            this.previousCursor_ = undefined;
          }
        }
    };
      
    // @return {boolean} `false` to stop the drag sequence.
    app.Drag.prototype.handleUpEvent = function() {
        this.coordinate_ = null;
        this.feature_ = null;
        return false;
    };
    
    // 表示用の view 変数の定義。
    view = new ol.View({
        projection  : "EPSG:3857",
        maxZoom     : MaxZoom,
        minZoom     : MinZoom,
        center      : convertCoordinate(center_lon, center_lat),
        zoom        : initZoom
    });
    // 地図変数 (map 変数) の定義（地理院地図を表示するように指定）
    map = new ol.Map({
        interactions: ol.interaction.defaults().extend([new app.Drag()]),
        target  : 'map',
        view    : view,
        layers  : [cyberJ, vectorLayer],//create a point
        controls: ol.control.defaults().extend([new ol.control.ScaleLine()])//<-----スケールラインコントロール set
    });
    //var picName_ = "iCon/HeadingLarge.gif";
    //var MarkerID = 0;
    addMarker(MarkerID,Longitude,Latitude,picName,map,Heading,Speed);
    view.setCenter(ol.proj.transform([Longitude,Latitude], "EPSG:4326", "EPSG:3857"));
    //setPoint();//setPoint確認__2018.03.21_ok
    // map の クリック
    map.on('singleclick', function(evt) {
        var coordinate = evt.coordinate;
        var pos = ol.proj.transform(coordinate, "EPSG:3857", "EPSG:4326");  //<---------緯度経度への変換
        MarkerID =MarkerID + 1;
        Lon_Point = pos[0];
        Lat_Point = pos[1];
        picName = "iCon/Bus.gif";
        Heading = 0;
        Speed = 0;
        addMarker(MarkerID,Lon_Point,Lat_Point,picName,map,Heading,Speed);
    });
}// function init_map
/*
//--- Test setPoint -------------------------------------------------_2018.03.21_ok
function setPoint(){    
    var picName_ = "iCon/Bus.gif";
    var MarkerID = 1;
    Heading = 0;
    Speed = 0;
    addMarker(MarkerID,139.386624,35.850324,picName_,map,Heading,Speed);
};
*/

//--- onSuccess Callback---------------------------------------------
function onSuccess(position) {
    var Latitude = position.coords.latitude;
    var Longitude = position.coords.longitude;
    Heading = position.coords.heading;
    Speed = position.coords.speed;
    if(Speed <= 0){
        Heading = 0;
        Speed = 0;
    }
    init_map(Latitude,Longitude,Heading,Speed);
/*
    alert('Latitude: '          + position.coords.latitude          + '\n' +
            'Longitude: '         + position.coords.longitude         + '\n' +
            'Altitude: '          + position.coords.altitude          + '\n' +
            'Accuracy: '          + position.coords.accuracy          + '\n' +
            'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
            'Heading: '           + position.coords.heading           + '\n' +
            'Speed: '             + position.coords.speed             + '\n' +
            'Timestamp: '         + position.timestamp                + '\n');
*/
};// function onSuccess()

//--- onError Callback receives a PositionError object ---------------
function onError(error) {
    alert('code: '    + error.code    + '\n' +
            'message: ' + error.message + '\n');
}// function onError()

//--- 表示用緯度経度への変換 -----------------------------------------
function convertCoordinate(longitude, latitude) {
    return ol.proj.transform([longitude, latitude], "EPSG:4326","EPSG:3857");
};//function convertCoordinate

//create a point
function addMarker(markerID,lon, lat,picName_,map,Heading,Speed){
    var geom = new ol.geom.Point( ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857') );
    var feature = new ol.Feature(geom);
    var ObjTXT;
    if (markerID == 0){
          ObjTXT = "MyPost";
    }else{
          ObjTXT = "T_" + String(markerID);
    };
        feature.setStyle([
        new ol.style.Style({
          image: new ol.style.Icon(({
              anchor: [0.5, 0.5],
              anchorXUnits: 'fraction',
              anchorYUnits: 'fraction',
              opacity     : 1,
              rotation    : Heading,
              src         : picName_//'iCon/Heading.gif'
          })),
          text: new ol.style.Text({
              offsetX: 35,
              offsetY: -15,
              text: ObjTXT,
              font: '15px Open Sans,sans-serif',
              fill: new ol.style.Fill({ color: '#111' }),
              stroke: new ol.style.Stroke({ color: '#eee', width: 2 })
          })
        })
    ]);
    feature.setId(markerID);//------------------------------------- 追加 Marker へのID set
    map.getLayers().item(1).getSource().addFeature(feature);
};//ENDOF create a point