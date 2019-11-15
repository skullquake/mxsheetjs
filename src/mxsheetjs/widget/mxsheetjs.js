require(
	{
		packages:[
			{
				name:'_canvas-datagrid',
				location:'/widgets/mxsheetjs/lib/',
				main:'canvas-datagrid'
			},
			{
				name:'_xlsx',
				location:'/widgets/mxsheetjs/lib/xlsx/0.8.0/',
				main:'xlsx.full.min'
			}
		]
	},
	[
		"dojo/_base/declare",
		"mxui/widget/_WidgetBase",
		"dijit/_TemplatedMixin",
		"mxui/dom",
		"dojo/dom",
		"dojo/dom-prop",
		"dojo/dom-geometry",
		"dojo/dom-class",
		"dojo/dom-style",
		"dojo/dom-construct",
		"dojo/_base/array",
		"dojo/_base/lang",
		"dojo/text",
		"dojo/html",
		"dojo/_base/event",
		"mxsheetjs/lib/jquery-1.11.2",
		"_canvas-datagrid",
		"_xlsx",
		"dojo/text!mxsheetjs/widget/template/mxsheetjs.html"
	],
	function(
		declare,
		_WidgetBase,
		_TemplatedMixin,
		dom,
		dojoDom,
		dojoProp,
		dojoGeometry,
		dojoClass,
		dojoStyle,
		dojoConstruct,
		dojoArray,
		lang,
		dojoText,
		dojoHtml,
		dojoEvent,
		_jQuery,
		canvasDatagrid,
		_xlsx,
		widgetTemplate
	){
		"use strict";
		var $ = _jQuery.noConflict(true);
		return declare(
			"mxsheetjs.widget.mxsheetjs",
			[
				_WidgetBase,
				_TemplatedMixin
			],
			{
				templateString: widgetTemplate,
				widgetBase: null,
				_handles: null,
				_contextObj: null,
				useworker: null,
				done: null,
				constructor: function () {
					this._handles = [];
				},
				postCreate: function () {
					this.useworker=false;
					this.done=false;
					console.log('----------------------------------------');
					console.log(this.id);
					console.log('----------------------------------------');
					console.log(_canvas_datagrid);
					console.log(_xlsx);
					console.log('----------------------------------------');
				},
				update: function (obj, callback) {
					this._contextObj = obj;
					this._updateRendering(callback);
				},
				resize: function (box) {
					/*
					this.grid.style.height = (window.innerHeight - 200) + "px";
					this.grid.style.width = (window.innerWidth - 200) + "px";
					*/
				},
				uninitialize: function () {
				},
				_updateRendering: function (callback) {
					if (this._contextObj !== null) {
						if(!this.done){
							this.done=true;
							var fileurl="/file?guid="+this._contextObj.getGuid();
							this.init(fileurl);
						}else{
						}
						dojoStyle.set(this.domNode, "display", "block");
					} else {
						dojoStyle.set(this.domNode, "display", "none");
					}
					this._executeCallback(callback, "_updateRendering");
				},
				_execMf: function (mf, guid, cb) {
					if (mf && guid) {
						mx.ui.action(mf, {
							params: {
								applyto: "selection",
								guids: [guid]
							},
							callback: lang.hitch(this, function (objs) {
								if (cb && typeof cb === "function") {
									cb(objs);
								}
							}),
							error: function (error) {
								console.debug(error.description);
							}
						}, this);
					}
				},
				_executeCallback: function (cb, from) {
					if (cb && typeof cb === "function") {
						cb();
					}
				},
				destroy:function(){
				},
				init:function(url){
					this.cdg = canvasDatagrid({
						parentNode: this.grid
					});
					this.cdg.style.height = '100%';
					this.cdg.style.width = '100%';
					this.loadfile(url);
				},
				loadfile:function(url){
					console.log('----------------------------------------');
					console.log(this.id+': loadfile:function(url)');
					console.log('----------------------------------------');
					/* -- try dojo function
					request(
						{
							url: yoururl,
							method: 'GET',
							encoding: null
						},
						function(
							error,
							response,
							body
						){
							if(!error&&response.statusCode===200){
								res.send(response.statusCode, body);
							} else {
								res.send(response.statusCode, body.toString('utf8'));
							}
						}
					);
*/

					var req = new XMLHttpRequest();
					req.open("GET", url);
					req.overrideMimeType("text/plain; charset=x-user-defined");
					req.onerror = () => console.log(`Error loading ${path}: ${req.statusText}`);
					req.responseType = "arraybuffer";
					req.onload = dojo.hitch(
						this,
						function() {
							/*
							console.log(req.response);//.responseText);
							if (this.status === 200) {
								console.log('a')
							this.nes_boot(this.responseText);
							} else if (this.status === 0) {
								console.log('b')
								// Aborted, so ignore error
							} else {
								console.log('c')
								req.onerror();
							}
							*/
							console.log(req);
							let data = new Uint8Array(req.response);
							let arr = new Array();
							for (let i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
							let bstr = arr.join("");
							this.workbook = XLSX.read(bstr, {type: "binary"});
							this.firstSheet = this.workbook.SheetNames[0];
							/*
							Object.keys(workbook).forEach(
								dojo.hitch(
									this,
									function(key) {
										//console.log(key, temp0[key]);
										//this._onsheet(this.to_json(workbook[key]),[key])
										this._onsheet(this.to_json(workbook)[key],[key])
									}
								)
							);
							*/
							//this._onsheet(this.to_json(workbook).foo0,['foo'])
							this.workbookjson=this.to_json(this.workbook);
							this.make_buttons(
								this.workbook.SheetNames,
								dojo.hitch(
									this,
									function(){
									}
								)
							);
							this.workbook.SheetNames.forEach(
								dojo.hitch(
									this,
									function(s,sidx){
										this._onsheet(this.workbookjson[s],[s],function(){})
									}
								)
							);
						}
					)
					req.send();

				},
				_onsheet:function(json,sheetnames,select_sheet_cb){
					//document.getElementById('footnote').style.display = "none";
					//this.make_buttons(sheetnames, select_sheet_cb);
					/* show grid */
					this.grid.style.display = "block";
					this.resize();

					/* set up table headers */
					var L = 0;
					json.forEach(function(r) { if(L < r.length) L = r.length; });
					console.log(L);
					for(var i = json[0].length; i < L; ++i) {
						json[0][i] = "";
					}

					/* load data */
					this.cdg.data = json;
				},
				make_buttons:function(sheetnames,cb){
					this.buttons.innerHTML = "";
					sheetnames.forEach(
						dojo.hitch(
							this,
							function(s,idx){
								var btn=dojo.create(
									'btn',
									{
										innerHTML:s,
										class:'btn btn-default'
									}
								);

								this.connect(
									btn,
									"click",
									dojo.hitch(
										this,
										function(e){
											console.log(this.workbookjson);
											console.log(this.workbook);
											console.log(idx);
											console.log(s);
											console.log(this.workbookjson[s]);
											this._onsheet(this.workbookjson[s],[s],function(){})
										}
									)
								);
								dojo.place(btn,this.buttons);
								/*
								var btn = document.createElement('button');
								btn.type = 'button';
								btn.class= 'btn btn-default';
								btn.name = 'btn' + idx;
								btn.text = s;
								var txt = document.createElement('h3'); txt.innerText = s; btn.appendChild(txt);
								btn.addEventListener(
									'click',
									dojo.hitch(
										this,
										function(){
											this._onsheet(this.workbookjson[s],[s],function(){})
										}
									),
									false
								);
								this.buttons.appendChild(btn);
								this.buttons.appendChild(document.createElement('br'));
								*/
							}
						)
					);
				},

				_badfile:function() {
					//alertify.alert('This file does not appear to be a valid Excel file.	If we made a mistake, please send this file to <a href="mailto:dev@sheetjs.com?subject=I+broke+your+stuff">dev@sheetjs.com</a> so we can take a look.', function(){});
				},
				_pending:function() {
					//alertify.alert('Please wait until the current file is processed.', function(){});
				},
				_large:function(len, cb) {
					//alertify.confirm("This file is " + len + " bytes and may take a few moments.	Your browser may lock up during this process.	Shall we play?", cb);
				},
				_failed:function(e) {
					//console.log(e, e.stack);
					//alertify.alert('We unfortunately dropped the ball here.	Please test the file using the <a href="/js-xlsx/">raw parser</a>.	If there are issues with the file processor, please send this file to <a href="mailto:dev@sheetjs.com?subject=I+broke+your+stuff">dev@sheetjs.com</a> so we can make things right.', function(){});
				},
				_workstart:function(){
					//spinner = new Spinner().spin(_target);
				},
				_workend:function(){
					//spinner.stop();
				},
				to_json:function(workbook){
					if(this.useworker && workbook.SSF) XLSX.SSF.load_table(workbook.SSF);
					var result = {};
					workbook.SheetNames.forEach(function(sheetName) {
						var roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {raw:false, header:1});
						if(roa.length > 0) result[sheetName] = roa;
					});
					return result;
				},
				choose_sheet:function(sheetidx){
					process_wb(last_wb, sheetidx);
				},
				process_wb:function(wb,sheetidx){
					last_wb = wb;
					opts.on.wb(wb, sheetidx);
					var sheet = wb.SheetNames[sheetidx||0];
					var json = this.to_json(wb)[sheet];
					opts.on.sheet(json, wb.SheetNames, choose_sheet);
				}
			}
		);
	}
);

//require(["mxsheetjs/widget/mxsheetjs"]);
