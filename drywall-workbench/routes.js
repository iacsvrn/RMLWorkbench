'use strict';

var express = require('express');

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.set('X-Auth-Required', 'true');
  req.session.returnUrl = req.originalUrl;
  res.redirect('/login/');
}

function ensureAdmin(req, res, next) {
  if (req.user.canPlayRoleOf('admin')) {
    return next();
  }
  res.redirect('/');
}

function ensureAccount(req, res, next) {
  if (req.user.canPlayRoleOf('account')) {
    if (req.app.config.requireAccountVerification) {
      if (req.user.roles.account.isVerified !== 'yes' && !/^\/account\/verification\//.test(req.url)) {
        return res.redirect('/account/verification/');
      }
    }
    return next();
  }
  res.redirect('/');
}

exports = module.exports = function(app, passport, upload, ldfserver) {   

  var workbenchCtrl = require('./workbench/WorkbenchController');

  /** 
  * Workbench API 
  **/  

  //acces to workbench
  app.all('/workbench*', ensureAuthenticated);
  app.get('/workbench/', require('./views/workbench/index').init);

  //uploading to workbench
  app.post('/workbench/fetch/input', upload.single('sourceUpload'), workbenchCtrl.uploadSource);
  app.get(('/workbench/fetch/input'), workbenchCtrl.getInputs);
  app.post('/workbench/fetch/mapping', upload.single('mappingUpload'), workbenchCtrl.uploadMapping);
  app.get('/workbench/fetch/mapping', workbenchCtrl.getMappings);
  app.post('/workbench/fetch/rdf', upload.single('rdfUpload'), workbenchCtrl.uploadRDF);
  app.get('/workbench/fetch/rdf', workbenchCtrl.getRdf);
  app.post('/workbench/fetch/csvw', workbenchCtrl.addCSVW);
  app.post('/workbench/fetch/db', workbenchCtrl.addDB);
  app.post('/workbench/fetch/api', workbenchCtrl.addAPI);
  app.post('/workbench/fetch/sparql', workbenchCtrl.addSPARQL);  
  app.post('/workbench/fetch/dcat', workbenchCtrl.addDCAT);    
  app.get('/workbench/fetch/description', workbenchCtrl.getDataDescriptions);
  app.post('/workbench/fetch/logical_db', workbenchCtrl.addlogical_DB);
  app.post('/workbench/fetch/logical_api', workbenchCtrl.addlogical_API);
  app.post('/workbench/fetch/logical_sparql', workbenchCtrl.addlogical_SPARQL);  
  app.post('/workbench/fetch/logical_dcat', workbenchCtrl.addlogical_DCAT);    
  app.get('/workbench/fetch/logical_description', workbenchCtrl.getLogicalDescriptions);
  app.get('/workbench/fetch/mapping_sources', workbenchCtrl.getInputsFromMapping);

  //data sources
  app.post('/workbench/mapping/data/update', workbenchCtrl.updateDataSource);

  app.post('/workbench/mapping/update', workbenchCtrl.updateMapping);

  //logical sources
  app.post('/workbench/mapping/logical/update', workbenchCtrl.updateLogicalSource);

  //mapping definitions
  app.post('/workbench/mapping/definition/update', workbenchCtrl.updateMappingDefinition);

  //mapping on workbench
  app.post('/workbench/mapping/execute/:mapping_id', workbenchCtrl.executeMappingFromFile);
  app.post('/workbench/mapping/execute/:mapping_id/triples', workbenchCtrl.executeMappingFromTriples);

  //scheduling on workbench
  app.post('/workbench/addToSchedule', workbenchCtrl.addToSchedule);
  app.get('/workbench/schedules', workbenchCtrl.getSchedules);
  app.post('/workbench/schedules/cancel', workbenchCtrl.cancelJob);
  app.get('/workbench/schedules/new', workbenchCtrl.isNewlyExecuted);
  
  //clearing workbench
  app.post('/workbench/clear/all/source', workbenchCtrl.clearAllSources);
  app.post('/workbench/clear/all/mapping', workbenchCtrl.clearAllMappings);
  app.post('/workbench/clear/all/rdf', workbenchCtrl.clearAllRdf);
  app.post('/workbench/clear/all/description', workbenchCtrl.clearAllDescriptions);
  app.post('/workbench/clear/all', workbenchCtrl.clearAll);
  app.post('/workbench/clear/source', workbenchCtrl.clearSources);
  app.post('/workbench/clear/mapping', workbenchCtrl.clearMappings);
  app.post('/workbench/clear/rdf', workbenchCtrl.clearRdf);
  app.post('/workbench/clear/description', workbenchCtrl.clearDescription);
  app.post('/workbench/clear/all', workbenchCtrl.clearAll);
  app.post('/workbench/clear/endpoint', workbenchCtrl.removeSparqlEndpoint);
  app.post('/workbench/clear/all/endpoint', workbenchCtrl.removeAllSparqlEndpoints);
  app.post('/workbench/clear/all/logical', workbenchCtrl.clearAllLogicals);
  app.post('/workbench/clear/logical', workbenchCtrl.clearLogical);
  
  //sparql interface
  app.post('/workbench/sparql/endpoint', workbenchCtrl.addSparqlEndpoint);
  app.post('/workbench/sparql/execute', workbenchCtrl.executeQueries);
  app.get('/workbench/sparql/endpoints', workbenchCtrl.getEndpoints);
  
  //
  app.post('/workbench/publish/ldf', workbenchCtrl.publishToLDF);
  

  /**
  * User management
  **/
  
  //front end
  app.get('/', require('./views/index').init);
  app.get('/about/', require('./views/about/index').init);
  app.get('/contact/', require('./views/contact/index').init);
  app.post('/contact/', require('./views/contact/index').sendMessage);

  //sign up
  app.get('/signup/', require('./views/signup/index').init);
  app.post('/signup/', require('./views/signup/index').signup);

  //social sign up
  app.post('/signup/social/', require('./views/signup/index').signupSocial);
  app.get('/signup/twitter/', passport.authenticate('twitter', { callbackURL: '/signup/twitter/callback/' }));
  app.get('/signup/twitter/callback/', require('./views/signup/index').signupTwitter);
  app.get('/signup/github/', passport.authenticate('github', { callbackURL: '/signup/github/callback/', scope: ['user:email'] }));
  app.get('/signup/github/callback/', require('./views/signup/index').signupGitHub);
  app.get('/signup/facebook/', passport.authenticate('facebook', { callbackURL: '/signup/facebook/callback/', scope: ['email'] }));
  app.get('/signup/facebook/callback/', require('./views/signup/index').signupFacebook);
  app.get('/signup/google/', passport.authenticate('google', { callbackURL: '/signup/google/callback/', scope: ['profile email'] }));
  app.get('/signup/google/callback/', require('./views/signup/index').signupGoogle);
  app.get('/signup/tumblr/', passport.authenticate('tumblr', { callbackURL: '/signup/tumblr/callback/' }));
  app.get('/signup/tumblr/callback/', require('./views/signup/index').signupTumblr);

  //login/out
  app.get('/login/', require('./views/login/index').init);
  app.post('/login/', require('./views/login/index').login);
  app.get('/login/forgot/', require('./views/login/forgot/index').init);
  app.post('/login/forgot/', require('./views/login/forgot/index').send);
  app.get('/login/reset/', require('./views/login/reset/index').init);
  app.get('/login/reset/:email/:token/', require('./views/login/reset/index').init);
  app.put('/login/reset/:email/:token/', require('./views/login/reset/index').set);
  app.get('/logout/', require('./views/logout/index').init);

  //social login
  app.get('/login/twitter/', passport.authenticate('twitter', { callbackURL: '/login/twitter/callback/' }));
  app.get('/login/twitter/callback/', require('./views/login/index').loginTwitter);
  app.get('/login/github/', passport.authenticate('github', { callbackURL: '/login/github/callback/' }));
  app.get('/login/github/callback/', require('./views/login/index').loginGitHub);
  app.get('/login/facebook/', passport.authenticate('facebook', { callbackURL: '/login/facebook/callback/' }));
  app.get('/login/facebook/callback/', require('./views/login/index').loginFacebook);
  app.get('/login/google/', passport.authenticate('google', { callbackURL: '/login/google/callback/', scope: ['profile email'] }));
  app.get('/login/google/callback/', require('./views/login/index').loginGoogle);
  app.get('/login/tumblr/', passport.authenticate('tumblr', { callbackURL: '/login/tumblr/callback/', scope: ['profile email'] }));
  app.get('/login/tumblr/callback/', require('./views/login/index').loginTumblr);

  //admin
  app.all('/admin*', ensureAuthenticated);
  app.all('/admin*', ensureAdmin);
  app.get('/admin/', require('./views/admin/index').init);

  //admin > users
  app.get('/admin/users/', require('./views/admin/users/index').find);
  app.post('/admin/users/', require('./views/admin/users/index').create);
  app.get('/admin/users/:id/', require('./views/admin/users/index').read);
  app.put('/admin/users/:id/', require('./views/admin/users/index').update);
  app.put('/admin/users/:id/password/', require('./views/admin/users/index').password);
  app.put('/admin/users/:id/role-admin/', require('./views/admin/users/index').linkAdmin);
  app.delete('/admin/users/:id/role-admin/', require('./views/admin/users/index').unlinkAdmin);
  app.put('/admin/users/:id/role-account/', require('./views/admin/users/index').linkAccount);
  app.delete('/admin/users/:id/role-account/', require('./views/admin/users/index').unlinkAccount);
  app.delete('/admin/users/:id/', require('./views/admin/users/index').delete);

  //admin > administrators
  app.get('/admin/administrators/', require('./views/admin/administrators/index').find);
  app.post('/admin/administrators/', require('./views/admin/administrators/index').create);
  app.get('/admin/administrators/:id/', require('./views/admin/administrators/index').read);
  app.put('/admin/administrators/:id/', require('./views/admin/administrators/index').update);
  app.put('/admin/administrators/:id/permissions/', require('./views/admin/administrators/index').permissions);
  app.put('/admin/administrators/:id/groups/', require('./views/admin/administrators/index').groups);
  app.put('/admin/administrators/:id/user/', require('./views/admin/administrators/index').linkUser);
  app.delete('/admin/administrators/:id/user/', require('./views/admin/administrators/index').unlinkUser);
  app.delete('/admin/administrators/:id/', require('./views/admin/administrators/index').delete);

  //admin > admin groups
  app.get('/admin/admin-groups/', require('./views/admin/admin-groups/index').find);
  app.post('/admin/admin-groups/', require('./views/admin/admin-groups/index').create);
  app.get('/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').read);
  app.put('/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').update);
  app.put('/admin/admin-groups/:id/permissions/', require('./views/admin/admin-groups/index').permissions);
  app.delete('/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').delete);

  //admin > accounts
  app.get('/admin/accounts/', require('./views/admin/accounts/index').find);
  app.post('/admin/accounts/', require('./views/admin/accounts/index').create);
  app.get('/admin/accounts/:id/', require('./views/admin/accounts/index').read);
  app.put('/admin/accounts/:id/', require('./views/admin/accounts/index').update);
  app.put('/admin/accounts/:id/user/', require('./views/admin/accounts/index').linkUser);
  app.delete('/admin/accounts/:id/user/', require('./views/admin/accounts/index').unlinkUser);
  app.post('/admin/accounts/:id/notes/', require('./views/admin/accounts/index').newNote);
  app.post('/admin/accounts/:id/status/', require('./views/admin/accounts/index').newStatus);
  app.delete('/admin/accounts/:id/', require('./views/admin/accounts/index').delete);

  //admin > statuses
  app.get('/admin/statuses/', require('./views/admin/statuses/index').find);
  app.post('/admin/statuses/', require('./views/admin/statuses/index').create);
  app.get('/admin/statuses/:id/', require('./views/admin/statuses/index').read);
  app.put('/admin/statuses/:id/', require('./views/admin/statuses/index').update);
  app.delete('/admin/statuses/:id/', require('./views/admin/statuses/index').delete);

  //admin > categories
  app.get('/admin/categories/', require('./views/admin/categories/index').find);
  app.post('/admin/categories/', require('./views/admin/categories/index').create);
  app.get('/admin/categories/:id/', require('./views/admin/categories/index').read);
  app.put('/admin/categories/:id/', require('./views/admin/categories/index').update);
  app.delete('/admin/categories/:id/', require('./views/admin/categories/index').delete);

  //admin > search
  app.get('/admin/search/', require('./views/admin/search/index').find);

  //account
  app.all('/account*', ensureAuthenticated);
  app.all('/account*', ensureAccount);
  app.get('/account/', require('./views/account/index').init);

  //account > verification
  app.get('/account/verification/', require('./views/account/verification/index').init);
  app.post('/account/verification/', require('./views/account/verification/index').resendVerification);
  app.get('/account/verification/:token/', require('./views/account/verification/index').verify);

  //account > settings
  app.get('/account/settings/', require('./views/account/settings/index').init);
  app.put('/account/settings/', require('./views/account/settings/index').update);
  app.put('/account/settings/identity/', require('./views/account/settings/index').identity);
  app.put('/account/settings/password/', require('./views/account/settings/index').password);

  //account > settings > social
  app.get('/account/settings/twitter/', passport.authenticate('twitter', { callbackURL: '/account/settings/twitter/callback/' }));
  app.get('/account/settings/twitter/callback/', require('./views/account/settings/index').connectTwitter);
  app.get('/account/settings/twitter/disconnect/', require('./views/account/settings/index').disconnectTwitter);
  app.get('/account/settings/github/', passport.authenticate('github', { callbackURL: '/account/settings/github/callback/' }));
  app.get('/account/settings/github/callback/', require('./views/account/settings/index').connectGitHub);
  app.get('/account/settings/github/disconnect/', require('./views/account/settings/index').disconnectGitHub);
  app.get('/account/settings/facebook/', passport.authenticate('facebook', { callbackURL: '/account/settings/facebook/callback/' }));
  app.get('/account/settings/facebook/callback/', require('./views/account/settings/index').connectFacebook);
  app.get('/account/settings/facebook/disconnect/', require('./views/account/settings/index').disconnectFacebook);
  app.get('/account/settings/google/', passport.authenticate('google', { callbackURL: '/account/settings/google/callback/', scope: ['profile email'] }));
  app.get('/account/settings/google/callback/', require('./views/account/settings/index').connectGoogle);
  app.get('/account/settings/google/disconnect/', require('./views/account/settings/index').disconnectGoogle);
  app.get('/account/settings/tumblr/', passport.authenticate('tumblr', { callbackURL: '/account/settings/tumblr/callback/' }));
  app.get('/account/settings/tumblr/callback/', require('./views/account/settings/index').connectTumblr);
  app.get('/account/settings/tumblr/disconnect/', require('./views/account/settings/index').disconnectTumblr);

  //editor
  app.get('/editor/', require('./views/editor/index').init);

  //route not found
  app.all('*', require('./views/http/index').http404);
};
