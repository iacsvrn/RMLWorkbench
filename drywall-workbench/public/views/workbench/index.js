/* global app:true */

(function() {

    'use strict';    


    app = app || {};
    
    app.currentModel;
    
    app.currentTriples = [];
    
    
    /***
     * 
     * MODELS PUBLISH
     * 
     ***/

    app.Publish = Backbone.Model.extend({
        idAttribute: '_id',
        defaults: {
            _id: undefined,
            filename: ''
        }
    });

    app.Publishes = Backbone.Collection.extend({
        model: app.Publish,
        url: '/workbench/fetch/rdf'
    });
    
    /***
     * 
     * MODELS MAPPING
     * 
     ***/
    
    app.Mapping = Backbone.Model.extend({
        idAttribute: '_id',
        defaults: { 
            _id: undefined,
            filename: ''
        },
        url: '/workbench/mapping/execute/'
    });

    app.Mappings = Backbone.Collection.extend({
        model: app.Mapping,
        url: '/workbench/fetch/mapping'
    });
    
    /***
     * 
     * MODELS TRIPLES
     * 
     ***/
    
    app.Triple = Backbone.Model.extend({
        idAttribute: '_id',
        defaults: {}
    });
    
    app.Triples = Backbone.Collection.extend({
        model: app.Triple 
    });
    
    
    /***
     * 
     * VIEWS MAPPING
     * 
     ***/
    
    
    app.ExecuteMappingView = Backbone.View.extend({
        
        template: _.template($('#execute').html()),        
        
        
        execute: function() {
          //this.model.fetch({data:{'mapping_id':this.model.attributes._id},type:'POST' })  
          
           
        },
        
        initialize: function() {
               
        },
        
        render: function() {
           $(this.el).html(this.template(this.model.toJSON()));      
           $('#selectAllCheckbox').change(function() {
               var selections = $('#triplelistdiv').children().children();
               if($('#selectAllCheckbox').prop( "checked" )) {                    
                    for(var i = 0; i < selections.length; i++) {
                        var selection = selections.eq(i).find('input');
                        selections.eq(i).find('input').prop('checked', true);
                        
                    }    
               } else {
                    for(var i = 0; i < selections.length; i++) {
                        selections.eq(i).find('input').prop('checked', false);
                    }   
               }
           });
           return this;            
        }    
    });
    
    app.ExecuteButtonView = Backbone.View.extend({
        
        template: _.template($('#executeMappingButton').html()),        
        
        events: {
           'click button' : 'execute'
        }, 
        
        execute: function() {
          
          var selections = $('#triplelistdiv').children().children();
          var triplesToBeExecuted = [];
          for(var i = 0; i < selections.length; i++) {
              if(selections.eq(i).find('input').prop('checked')) {
                  triplesToBeExecuted.push(this.model.attributes.triples[i]._id);
              }
          }  
          
          console.log(triplesToBeExecuted);
          
          var triples = {
              triples: triplesToBeExecuted
          }
            
          $.post('/workbench/mapping/execute/'+this.model.attributes._id+'/triples', triples , function() {              
              app.render();
          });  
        },          
        
        
        initialize: function() {
               
        },
        
        render: function() {
           $(this.el).html(this.template(this.model.toJSON()));      
           return this;            
        }    
    });
    
    app.ClearMappingView = Backbone.View.extend({
        
        template: _.template($('#clearmapping').html()),
        
        events: {
          'click .clearmapping' : 'clearmapping'  
        },
        
        clearmapping: function() {
          //this.model.fetch({data:{'mapping_id':this.model.attributes._id},type:'POST' })  
          $.post('/workbench/clear/mapping/',{mappings: [app.currentModel.attributes._id]},function() {
              app.render();
              });  
        },
        
        initialize: function() {
            this.model = app.currentModel;    
        },
        
        render: function() {
           $(this.el).html(this.template(this.model.toJSON()));      
           return this;            
        }    
    });
    
    app.ClearAllMappingsView = Backbone.View.extend({
        
        template: _.template($('#clearallmappings').html()),
        
        events: {
          'click .clearallmappings' : 'clearallmappings'  
        },
        
        clearallmappings: function() {
          //this.model.fetch({data:{'mapping_id':this.model.attributes._id},type:'POST' })  
          $.post('/workbench/clear/all/mapping',function() {
              app.render();
              });  
        },
        
        initialize: function() {
            this.model = app.currentModel;    
        },
        
        render: function() {
           $(this.el).html(this.template(this.model.toJSON()));      
           return this;            
        }    
    });

    app.MappingsView = Backbone.View.extend({
        tagName: 'div',
        className: 'list-group mappingsView',
        
        initialize: function() {

        },

        render: function(eventName) {
            _.each(this.model.models, function(mapping) {
                $(this.el).append(new app.MappingItemView({ model: mapping }).render().el);
            }, this);
            return this;
        }
    });
    
    app.MappingsContentView = Backbone.View.extend({
       tagName: 'pre',
       template: _.template($('#mapping-content').html()),
       
       initialize: function(){
		    this.model.on('change', this.render, this);
       },                
       
       render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;  
       }
    });
    
    app.TripleListView = Backbone.View.extend({
        
        events: {
          'click .executeMappingButton' : 'execute'  
        },
        
        execute: function() {
  
        },

        initialize: function() {
                
        },     
        render: function() {
            $(this.el).empty();
            _.each(this.model.models, function(triple) {
                $(this.el).append(new app.TripleItemView({ model: triple }).render().el);
            }, this);
             
            return this;
        }       
    });
    
    app.TripleItemView = Backbone.View.extend({
        template: _.template($('#triplelist').html()),
        initialize: function() {
            
        },
        
        events: {
        },

        render: function() {            
            $(this.el).html(this.template(this.model.toJSON()));
            
            return this;
        } 
    });

    app.MappingItemView = Backbone.View.extend({
        tagName: 'a',
        className: 'list-group-item viewMapping',

        template: _.template($('#mapping-list-item').html()),

        initialize: function() {
            
        },
        
        events: {
	        'click h6' : 'viewMapping'
        },

        viewMapping: function(ev){
              
               
                app.mappingsContentView.model = this.model; 
                app.executeMappingView.model = this.model;
                app.executeButtonView.model = this.model;
                app.currentModel = this.model;
                
                var triples = [];
                for(var i = 0; i < this.model.attributes.triples.length; i++) {
                    triples.push(new app.Triple(this.model.attributes.triples[i]));
                }              
                
                app.tripleListView.model = {models : triples};
                
                app.tripleListView.render();
                app.executeButtonView.render();               
                app.mappingsContentView.render(); 
                //$('#mappingContent').html(app.mappingsContentView.render().el)  
        },

        render: function(eventName) {
            $(this.el).attr('href','#');
            $(this.el).attr('data-index', this.model.collection.indexOf(this.model));
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        }

    });
    
    /***
     * 
     * VIEWS PUBLISHING
     * 
     ***/
    
    app.PublishesView = Backbone.View.extend({
        tagName: 'div',
        className: 'list-group publishView',
        
        initialize: function() {
                    
        },

        render: function(eventName) {
            _.each(this.model.models, function(publish) {
                $(this.el).append(new app.PublishItemView({ model: publish }).render().el);
            }, this);
            return this;
        }
    });
    
    app.PublishContentView = Backbone.View.extend({
       tagName: 'pre', 
       template: _.template($('#publish-content').html()),
       
       initialize: function(){
		    this.model.on('change', this.render, this);
       },     
                    
       
       render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;  
       }
    });

    app.PublishItemView = Backbone.View.extend({
        tagName: 'a',
        className: 'list-group-item viewPublish',

        template: _.template($('#publish-list-item').html()),

        initialize: function() {
            
        },
        
        events: {
	        'click h6' : 'viewPublish'
        },

        viewPublish: function(ev){
                app.currentModel = this.model;
                app.publishContentView.model = this.model; 
                app.publishContentView.render(); 
                //$('#mappingContent').html(app.mappingsContentView.render().el)  
        },

        render: function(eventName) {
            $(this.el).attr('href','#');
            $(this.el).attr('data-index', this.model.collection.indexOf(this.model));
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        },


    });
    
    app.ClearPublishingView = Backbone.View.extend({
        
        template: _.template($('#clearpublishing').html()),
        
        events: {
          'click .clearpublishing' : 'clearpublishing'  
        },
        
        clearpublishing: function() {
          $.post('/workbench/clear/rdf',{rdf: [app.currentModel.attributes._id]},function() {
              app.render();
              });  
        },
        
        initialize: function() {
            this.model = app.publishes.models[0];    
        },
        
        render: function() {
           $(this.el).html(this.template(this.model.toJSON()));      
           return this;            
        }    
    });
    
    app.ClearAllPublishingsView = Backbone.View.extend({
        
        template: _.template($('#clearallpublishings').html()),
        
        events: {
          'click .clearallpublishings' : 'clearallpublishings'  
        },
        
        clearallpublishings: function() {
 
          $.post('/workbench/clear/all/rdf',function() {
              app.render();
              });  
        },
        
        initialize: function() {
            this.model = app.publishes.models[0];    
        },
        
        render: function() {
           $(this.el).html(this.template(this.model.toJSON()));      
           return this;            
        }    
    });
    
    
    /***
     * 
     * VIEWS DATA ACCESS
     * 
     ***/
     
     
     /***
     * 
     * APP CONFIG
     * 
     ***/
    

    app.Router = Backbone.Router.extend({
        routes: {
            '': 'default',
        },
        initialize: function() {            
            app.render();          
        },
        default: function() {                    
                            
        }
    });
    
    
    /***
     * 
     * APP RENDERING
     * 
     ***/
    
    
    app.render = function() {
        
        app.mappings = new app.Mappings();                
            
        app.publishes = new app.Publishes();
        
        /***
        *
        * RENDERING MAPPINGS
        *
        ***/
        
        app.mappings.fetch({success: function() {    
                            
                if(app.mappings.models.length != 0) {
                
                    //replace <> with lt& en gt&    
                    for(var i = 0; i < app.mappings.models.length; i++) {
                        var attributes = app.mappings.models[i].attributes;
                        attributes.convertedData = attributes.data.replace(/</g,'&lt;').replace(/>/g, '&gt;');                                      
                    }       
                    
                    //creating views
                    app.currentModel = app.mappings.models[0];


                    app.mappingsView = new app.MappingsView({model:app.mappings});
                    app.mappingsContentView = new app.MappingsContentView({model: app.currentModel});
                    app.executeMappingView = new app.ExecuteMappingView({model: app.currentModel});
                    app.executeButtonView = new app.ExecuteButtonView({model: app.currentModel});
                    app.clearMappingView = new app.ClearMappingView();
                    app.clearAllMappingsView = new app.ClearAllMappingsView();
                    
                    var triples = [];
                    for(var i = 0; i < app.currentModel.attributes.triples.length; i++) {
                        triples.push(new app.Triple(app.currentModel.attributes.triples[i]));
                    }
                    
                    app.tripleListView = new app.TripleListView({model: { models:triples}});
                    
                    
                    //rendering with jquery
                    $('#mappingMain').html(app.mappingsView.render().el);    
                    $('#mappingContent').html(app.mappingsContentView.render().el);
                    $('#mappingmenu').html(app.executeMappingView.render().el);
                    $('#clearmappingbutton').html(app.clearMappingView.render().el);
                    $('#clearallmappingsbutton').html(app.clearAllMappingsView.render().el);
                    $('#triplelistdiv').html(app.tripleListView.render().el);
                    $('#executeMappingButtonDiv').html(app.executeButtonView.render().el);
                } else {
                    //clearing workbench
                    $('.workbenchElement').empty();
                }
                
            }}); 
            
            
            /***
            *
            * RENDERING PUBLISHINGS
            *
            ***/ 
             
                       
            app.publishes.fetch({success: function() {
                
                if(app.publishes.models.length != 0) {
                
                    //replace <> with lt& en gt&    
                    for(var i = 0; i < app.publishes.models.length; i++) {
                        var attributes = app.publishes.models[i].attributes;
                        attributes.convertedData = attributes.data.replace(/</g,'&lt;').replace(/>/g, '&gt;');                                      
                    }
                    //creating views
                    app.publishesView = new app.PublishesView({model:app.publishes});
                    app.publishContentView = new app.PublishContentView({model: app.publishes.models[0]});
                    app.clearPublishingView = new app.ClearPublishingView();
                    app.clearAllPublishingsView = new app.ClearAllPublishingsView();
                    
                    //rendering with jquery
                    $('#publishMain').html(app.publishesView.render().el);    
                    $('#publishContent').html(app.publishContentView.render().el);    
                    $('#clearpublishingbutton').html(app.clearPublishingView.render().el);
                    $('#clearallpublishingsbutton').html(app.clearAllPublishingsView.render().el);  
                                      
                } else {
                    $('.workbenchElement').empty();   
                }
            }});
    };
    
    
    
    
    /*
    *   ##########
    *   # JQuery #
    *   ##########
    */
    
    
    /***
     * 
     * UPLOADING FILES
     * 
     ***/
     
     
    /*
    * Uploading mapping file
    */
    $("#uploadMapping_Form").on("submit", function(event){
        event.preventDefault();

        var form_url = $("form[id='uploadMapping_Form']").attr("action");
        var CSRF_TOKEN = $('input[name="_csrf"]').val();                    

        var form = new FormData();
        form.append('mappingUpload', $('input[id=mappingFile]')[0].files[0]);        


        $.ajax({
            url:  form_url,
            type: 'POST',
            headers: {
                'X-CSRF-Token': $.cookie("_csrfToken")
            },
            "mimeType": "multipart/form-data",
            data: form,
            contentType: false, 
            processData: false,
            
            dataType: 'JSON',
            statusCode: {
                200: function() {
                    app.render();
                }   
            }            
        }); 
        
                           
    });
    
    /**
     * Uploading RDF file
     */
    
    $("#uploadPublishing_Form").on("submit", function(event){
        event.preventDefault();                     

        var form_url = $("form[id='uploadPublishing_Form']").attr("action");
        var CSRF_TOKEN = $('input[name="_csrf"]').val();                    

        var form = new FormData();
        form.append('rdfUpload', $('input[id=publishingFile]')[0].files[0]);        


        $.ajax({
            url:  form_url,
            type: 'POST',
            headers: {
                'X-CSRF-Token': $.cookie("_csrfToken")
            },
            "mimeType": "multipart/form-data",
            data: form,
            contentType: false, 
            processData: false,
            
            dataType: 'JSON',
            statusCode: {
                200: function() {
                    app.render();
                }   
            }            
        }); 
        
                           
    });
    
    
    
    
        app.firstLoad = true;
        app.router = new app.Router();
        Backbone.history.start();
    

}());