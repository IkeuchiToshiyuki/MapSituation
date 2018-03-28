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
    // Elements that make up the popup.
    var container = document.getElementById('popup');
    var content = document.getElementById('popup-content');
    var closer = document.getElementById('popup-closer');
    // Add a click handler to hide the popup.
    // @return {boolean} Don't follow the href.
    closer.onclick = function() {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
    };
    // Define a namespace for the application.
    var app = {};
    // @constructor @extends {ol.interaction.Pointer}
    app.Drag = function() {    
        ol.interaction.Pointer.call(this, {
          handleDownEvent: app.Drag.prototype.handleDownEvent,
          handleDragEvent: app.Drag.prototype.handleDragEvent,
          handleMoveEvent: app.Drag.prototype.handleMoveEvent,
          handleUpEvent: app.Drag.prototype.handleUpEvent
        });    
        // @type {ol.Pixel} @private
        this.coordinate_ = null;    
        // @type {string|undefined} @private
        this.cursor_ = 'pointer';            
        // @type {ol.Feature} @private
        this.feature_ = null;    
        // @type {string|undefined} @private
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
        }  
        return !!feature;
    };    

    // @param {ol.MapBrowserEvent} evt Map browser event.
    app.Drag.prototype.handleDragEvent = function(evt) {
        // --- 自己位置 Drag を回避------------------------------------------<--------- 2018.03.06
        TGT_ID = this.feature_.getId();
        if (TGT_ID == 0) return;
        // -------------------------------
        var deltaX = evt.coordinate[0] - this.coordinate_[0];
        var deltaY = evt.coordinate[1] - this.coordinate_[1];

        var geometry = this.feature_.getGeometry();
        geometry.translate(deltaX, deltaY);

        this.coordinate_[0] = evt.coordinate[0];
        this.coordinate_[1] = evt.coordinate[1];
        if(geometry){
            TargetMoving = true;
        };
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
        //ol.Feature.prototype.getId 
        var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(this.coordinate_, 'EPSG:3857', 'EPSG:4326'));
        var pos = ol.proj.transform(this.coordinate_, 'EPSG:3857', 'EPSG:4326');
        TGT_ID = this.feature_.getId();
        if (TGT_ID == 0) {
              MyPostFlag = true;
              return;
        };                    //------------------------------------------<--------- 自己位置の場合、諸言非表示 2018.03.05
        Lon_Point = pos[0];
        Lat_Point = pos[1];
        ClickTim  = ClickTime();//------------------------------------------<---------地図 Click 時刻取得
        var MGRS_Point = MGRSString (Lat_Point, Lon_Point);
        content.innerHTML = '<code>' + '<p>TargetID : ' + TGT_ID + '</p>' 
                                     + '<p>LatLon   : ' + hdms + '</p>'
                                     + '<p>MGRS(UTM): ' + MGRS_Point + '</p>'
                                     + '<p>Situation: ' + TGT[TGT_ID].Object + '</code>';
                                     //右クリックで目標生成した場合、TGT[TGT_ID].Objectが存在しない為 Error 2017.03.04
        PopUpData(this.coordinate_,content.innerHTML);
        /*
        TargetFlag = true;//------------------------------------------------<------------------------ 既設定 Target Flag
        if(TargetMoving == true){
            MoveClick();
            TargetMoving = false;
        }else{
            MarkerClick();
            TargetMoving = false;
        }//----------------------------------------------------<------------------------ Marker Click 関係 Buttonの有効化
        */
        DelObj = TGT_ID;//--------------------------------------------------<------------------------ Click Object ID
        this.coordinate_ = null;
        this.feature_ = null;        
        return false;
    };//End app.Drag.prototype.handleUpEvent

    // Create an overlay to anchor the popup to the map.
    var overlay = new ol.Overlay({
        element: container,
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
    });
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
        overlays: [overlay],//-------------------------------<--- PopUp 用 Overlay set
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
        marker(evt);
        //addMarker(MarkerID,Lon_Point,Lat_Point,picName,map,Heading,Speed);
    });
//---------- contextmenu
    var pin_icon    = 'pin_drop.png';
    var center_icon = 'center.png';
    var list_icon   = 'view_list.png';
    //--- contextmenu menu DATA
    var contextmenu_items = [
        {
            text: 'Center map here',
            classname: 'bold',
            icon: center_icon,
            callback: center
        },
        {
            text: 'Some Actions',
            icon: list_icon,
            items: [
                {
                    text: 'Center map here',
                    icon: center_icon,
                    callback: center
                },
                {
                    text: 'Add a Marker',
                    icon: pin_icon,
                    callback: marker
                }
            ]
        },
        {
            text: 'Add a Marker',
            icon: pin_icon,
            callback: marker
        },
            '-' // this is a separator
    ];
    //--- contextmenu menu DATA set
    var contextmenu = new ContextMenu({
        width: 180,
        items: contextmenu_items
    });

    map.addControl(contextmenu);//<----------------------------------------- contextmenu の追加
    //--- contextmenu removeMarker DATA set
    var removeMarkerItem = {
        text: 'Remove this Marker',
        classname: 'marker',
        callback: removeMarker
    };
    //--- contextmenu open event
    contextmenu.on('open', function (evt) {
        var feature =    map.forEachFeatureAtPixel(evt.pixel, function(ft, l){
        return ft;
        });
        //var feature =	map.forE//---------- contextmenu
        var pin_icon    = 'pin_drop.png';
        var center_icon = 'center.png';
        var list_icon   = 'view_list.png';
        //--- contextmenu menu DATA
        var contextmenu_items = [
          {
            text: 'Center map here',
            classname: 'bold',
            icon: center_icon,
            callback: center
          },
          {
            text: 'Some Actions',
            icon: list_icon,
            items: [
              {
                text: 'Center map here',
                icon: center_icon,
                callback: center
              },
              {
                text: 'Add a Marker',
                icon: pin_icon,
                callback: marker
              }
            ]
          },
          {
            text: 'Add a Marker',
            icon: pin_icon,
            callback: marker
          },
          '-' // this is a separator
        ];
        //--- contextmenu menu DATA set
        var contextmenu = new ContextMenu({
          width: 180,
          items: contextmenu_items
        });

        map.addControl(contextmenu);//<----------------------------------------- contextmenu の追加
        //--- contextmenu removeMarker DATA set
        var removeMarkerItem = {
          text: 'Remove this Marker',
          classname: 'marker',
          callback: removeMarker
        };
        //--- contextmenu open event
        contextmenu.on('open', function (evt) {
            var feature =    map.forEachFeatureAtPixel(evt.pixel, function(ft, l){
            return ft;
            });
            //var feature =	map.forEachFeatureAtPixel(evt.pixel, ft => ft);//旧プログラム <--exploreで動作阻害

            PopUpClose();//<----------------------------------------------------- popup close

            if (feature && feature.get('type') === 'removable') {
            contextmenu.clear();
            removeMarkerItem.data = { marker: feature };
            contextmenu.push(removeMarkerItem);
            } else {
            contextmenu.clear();
            contextmenu.extend(contextmenu_items);
            contextmenu.extend(contextmenu.getDefaultItems());
            }
        });
        //--- pointer move event
        map.on('pointermove', function (e) {
          if (e.dragging) return;

          var pixel = map.getEventPixel(e.originalEvent);
          var hit = map.hasFeatureAtPixel(pixel);

          map.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });achFeatureAtPixel(evt.pixel, ft => ft);//旧プログラム <--exploreで動作阻害

        PopUpClose();//<----------------------------------------------------- popup close

        if (feature && feature.get('type') === 'removable') {
            contextmenu.clear();
            removeMarkerItem.data = { marker: feature };
            contextmenu.push(removeMarkerItem);
        } else {
            contextmenu.clear();
            contextmenu.extend(contextmenu_items);
            contextmenu.extend(contextmenu.getDefaultItems());
        }
    });
    //--- pointer move event
    map.on('pointermove', function (e) {
        if (e.dragging) return;

        var pixel = map.getEventPixel(e.originalEvent);
        var hit = map.hasFeatureAtPixel(pixel);

        map.getTargetElement().style.cursor = hit ? 'pointer' : '';
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
//-------- functions ------------------------------------------------------------------------
//--- Click時刻のset 
function ClickTime(){
    var Day = new Date();
    var day = Day.getDate();
    var hour = Day.getHours();
    var minute = Day.getMinutes();
    var second = Day.getSeconds();
    var TimeDATA = day + "日 " + hour + ":" + minute + ":" + second;
    return TimeDATA;
};
//--- 表示用緯度経度への変換
function convertCoordinate(longitude, latitude) {
    return ol.proj.transform([longitude, latitude], "EPSG:4326","EPSG:3857");
};
//--- popup close
function PopUpClose(){
    overlay.setPosition(undefined);
    closer.blur();            
};
//--- from https://github.com/DmitryBaranovskiy/raphael
function elastic(t) {
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
};
//--- map center移動
function center(obj) {
  view.animate({
    duration: 700,
    easing: elastic,
    center: obj.coordinate
  });
};
//--- Marker削除
function removeMarker(obj) {
  vectorLayer.getSource().removeFeature(obj.data.marker);
};
//--- Marker set
function marker(obj) {
  MarkerID = MarkerID + 1;
  markerNo = MarkerID;
  picName_ = "iCon/Bus.gif" ;//PicName;
  //picName_ = "iCon/" + ActionPictures[CheckActionNo];//PicName;
  var coord4326 = ol.proj.transform(obj.coordinate, 'EPSG:3857', 'EPSG:4326');
  Lon_Point = coord4326[0];// <------------------------------------------------- 右クリック用座標取得 2018.03.04
  Lat_Point = coord4326[1];// <------------------------------------------------- 右クリック用座標取得 2018.03.04
  ClickTim  = ClickTime();//------------------------------------------<--------- 地図 Click 時刻取得
  alert(MarkerID);
  //DataList(1);//---------------------------------------------------------------- 履歴表示            2018.03.05
  AddMarker(obj,picName_,markerNo);
};
//--- Marker 追加
function AddMarker(obj,picName_,markerNo){
  var coord4326 = ol.proj.transform(obj.coordinate, 'EPSG:3857', 'EPSG:4326');
      template = 'Coordinate is ({x} | {y})';
      iconStyle = new ol.style.Style({
        image: new ol.style.Icon({ scale: 1, src: picName_ }),
        text: new ol.style.Text({
          offsetX: 20,
          offsetY: -15,
          text: "T_" + String(MarkerID),
          font: '15px Open Sans,sans-serif',
          fill: new ol.style.Fill({ color: '#111' }),
          stroke: new ol.style.Stroke({ color: '#eee', width: 2 })
        })
      });
      feature = new ol.Feature({
        type: 'removable',
        geometry: new ol.geom.Point(obj.coordinate)
      });
  feature.setStyle(iconStyle);
  feature.setId(markerNo);//------------------------------------- 追加 Marker へのID set
  vectorLayer.getSource().addFeature(feature);            
}

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

//--- popup DATA 生成
//create popup
function PopUpData(Location,Data){ 
    content.innerHTML = Data;
    overlay.setPosition(Location);
}
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
// ====　（ 座標変換 ）===============================================================
// 緯度経度 → MGRS
function MGRSString (Lat, Long){ 
    if (Lat < -80) return 'Too far South' ; if (Lat > 84) return 'Too far North' ;
    var c = 1 + Math.floor ((Long+180)/6);
    var e = c*6 - 183 ;
    var k = Lat*Math.PI/180;
    var l = Long*Math.PI/180;
    var m = e*Math.PI/180;
    var n = Math.cos (k);
    var o = 0.006739496819936062*Math.pow (n,2);
    var p = 40680631590769/(6356752.314*Math.sqrt(1 + o));
    var q = Math.tan (k);
    var r = q*q;
    var s = (r*r*r) - Math.pow (q,6);
    var t = l - m;
    var u = 1.0 - r + o;
    var v = 5.0 - r + 9*o + 4.0*(o*o);
    var w = 5.0 - 18.0*r + (r*r) + 14.0*o - 58.0*r*o;
    var x = 61.0 - 58.0*r + (r*r) + 270.0*o - 330.0*r*o;
    var y = 61.0 - 479.0*r + 179.0*(r*r) - (r*r*r);
    var z = 1385.0 - 3111.0*r + 543.0*(r*r) - (r*r*r);
    var aa = p*n*t + (p/6.0*Math.pow (n,3)*u*Math.pow (t,3)) + (p/120.0*Math.pow (n,5)*w*Math.pow (t,5)) + (p/5040.0*Math.pow (n,7)*y*Math.pow (t,7));
    var ab = 6367449.14570093*(k - (0.00251882794504*Math.sin (2*k)) + (0.00000264354112*Math.sin (4*k)) - (0.00000000345262*Math.sin (6*k)) + (0.000000000004892*Math.sin (8*k))) + (q/2.0*p*Math.pow (n,2)*Math.pow (t,2)) + (q/24.0*p*Math.pow (n,4)*v*Math.pow (t,4)) + (q/720.0*p*Math.pow (n,6)*x*Math.pow (t,6)) + (q/40320.0*p*Math.pow (n,8)*z*Math.pow (t,8));
    aa = aa*0.9996 + 500000.0;
    ab = ab*0.9996; if (ab < 0.0) ab += 10000000.0;
    var ad = 'CDEFGHJKLMNPQRSTUVWXX'.charAt (Math.floor (Lat/8 + 10));
    var ae = Math.floor (aa/100000);
    var af = ['ABCDEFGH','JKLMNPQR','STUVWXYZ'][(c-1)%3].charAt (ae-1);
    var ag = Math.floor (ab/100000)%20;
    var ah = ['ABCDEFGHJKLMNPQRSTUV','FGHJKLMNPQRSTUVABCDE'][(c-1)%2].charAt (ag);
    function pad (val) {if (val < 10) {val = '0000' + val} else if (val < 100) {val = '000' + val} else if (val < 1000) {val = '00' + val} else if (val < 10000) {val = '0' + val};return val};
    aa = Math.floor (aa%100000); aa = pad (aa);
    ab = Math.floor (ab%100000); ab = pad (ab);
    return c + ad + ' ' + af + ah + ' ' + aa + ' ' + ab;
};