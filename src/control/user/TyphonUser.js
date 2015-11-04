/**
 * typhon-user.js -- Provides a facade around Parse.User functionality enabling interaction via methods, but more
 * importantly the main eventbus. ES2015 Promises are used for all asynchronous operations.
 */

'use strict';

import _          from 'underscore';
import Parse      from 'parse';
import eventbus   from 'mainEventbus';
import                 'parseinit';

class TyphonUser
{
   constructor()
   {
      const user = Parse.User.current();

      eventbus.on('typhon:user:current', this.getCurrentUser, this);
      eventbus.on('typhon:user:escape', this.escape, this);
      eventbus.on('typhon:user:get', this.get, this);
      eventbus.on('typhon:user:get:https:url', this.getHTTPSUrl, this);
      eventbus.on('typhon:user:iscurrent', this.isCurrentUser, this);
      eventbus.on('typhon:user:login', this.logInUser, this);
      eventbus.on('typhon:user:logout', this.logOutUser, this);
      eventbus.on('typhon:user:password:reset', this.requestPasswordReset, this);
      eventbus.on('typhon:user:save', this.save, this);
      eventbus.on('typhon:user:set', this.set, this);
      eventbus.on('typhon:user:setandsave', this.setAndSave, this);
      eventbus.on('typhon:user:setandsave:images', this.setAndSaveImages, this);
      eventbus.on('typhon:user:signup', this.signUpUser, this);
      eventbus.on('typhon:user:tojson', this.toJSON, this);

      if (user !== null)
      {
         eventbus.triggerFirst('maindatactrl:add', 'typhon:user:current', user, 60000);

         // Identify the user and emit an event with the current user identity.
         eventbus.trigger('typhon:user:current:identity',
         {
            email: user.getEmail(),
            name: user.escape('username'),
            created_at: user.createdAt.getTime(),
            id: user.id
         });
      }
   }

   escape(key = null)
   {
      if (_.isUndefined(key) || key === null)
      {
         throw new Error('escape - key is undefined or null.');
      }

      const user = Parse.User.current();

      if (user === null)
      {
         throw new Error('escape - no current user.');
      }

      return user.escape(key);
   }

   get(key = null)
   {
      if (_.isUndefined(key) || key === null)
      {
         throw new Error('get - key is undefined or null.');
      }

      const user = Parse.User.current();

      if (user === null)
      {
         throw new Error('get - no current user.');
      }

      return user.get(key);
   }

   getHTTPSUrl(key = null)
   {
      if (_.isUndefined(key) || key === null)
      {
         throw new Error('getHTTPSUrl - key is undefined or null.');
      }

      const user = Parse.User.current();

      if (user === null)
      {
         throw new Error('getHTTPSUrl - no current user.');
      }

      return user.getHTTPSUrl(key);
   }

   getCurrentUser()
   {
      return Parse.User.current();
   }

   isCurrentUser()
   {
      return Parse.User.current() !== null;
   }

   logInUser(data = {})
   {
      return new Promise((resolve, reject) =>
      {
         if (!_.isObject(data))
         {
            throw new TypeError('logInUser - data is not an object.');
         }

         if (!_.isString(data.name))
         {
            throw new TypeError('logInUser - data.name is not a string or null.');
         }

         if (!_.isString(data.password))
         {
            throw new TypeError('logInUser - data.password is not a string or null.');
         }

         Parse.User.logIn(data.name, data.password).then((user) =>
         {
            if (user !== null)
            {
               eventbus.triggerFirst('maindatactrl:add', 'typhon:user:current', user, 60000);

               // Save most recent login date
               user.set('lastLoginAt', new Date());
               user.save();

               // Identify the user and emit an event with the current user identity.
               eventbus.trigger('typhon:user:current:identity',
               {
                  email: user.getEmail(),
                  name: user.escape('username'),
                  created_at: user.createdAt.getTime(),
                  id: user.id
               });
            }
            resolve(user !== null);
         },
         (error) =>
         {
            reject(error);
         });
      });
   }

   logOutUser()
   {
      return new Promise((resolve, reject) =>
      {
         Parse.User.logOut().then(() =>
         {
            eventbus.triggerFirst('maindatactrl:remove', 'typhon:user:current');
            eventbus.trigger('typhon:user:current:loggedout');
            resolve(true);
         },
         (error) =>
         {
            reject(error);
         });
      });
   }

   requestPasswordReset(data = {}, useCurrentUserEmail = false)
   {
      return new Promise((resolve, reject) =>
      {
         if (!_.isObject(data))
         {
            throw new TypeError('requestPasswordReset - data is not an object.');
         }

         if (!_.isBoolean(useCurrentUserEmail))
         {
            throw new TypeError('requestPasswordReset - useCurrentUserEmail is not an boolean.');
         }

         if (useCurrentUserEmail)
         {
            const user = Parse.User.current();

            if (user === null)
            {
               throw new Error('requestPasswordReset - useCurrentUserEmail requested, but no current user.');
            }

            data.email = user.get('email');
         }

         if (!_.isString(data.email))
         {
            throw new TypeError('requestPasswordReset - data.email is not a string or null.');
         }

         Parse.User.requestPasswordReset(data.email).then(() =>
         {
            resolve(true);
         },
         (error) =>
         {
            reject(error);
         });
      });
   }

   save()
   {
      return new Promise((resolve, reject) =>
      {
         const user = Parse.User.current();

         if (user === null)
         {
            throw new Error('save - no current user.');
         }

         user.save().then(() =>
         {
            resolve(true);
         },
         (error) =>
         {
            reject(error);
         });
      });
   }

   set(data = null)
   {
      if (_.isUndefined(data) || data === null)
      {
         throw new TypeError('set - data is undefined or null.');
      }

      if (!_.isObject(data))
      {
         throw new TypeError('set - data is not an object');
      }

      const user = Parse.User.current();

      if (user === null)
      {
         throw new Error('set - no current user.');
      }

      _.each(data, (value, key) =>
      {
         if (!_.isString(key))
         {
            console.log(`set - skipping key as it is not a string:  +${key}`);
         }
         else
         {
            switch(key)
            {
               case 'email':
                  user.setEmail(value);
                  break;

               default:
                  user.set(key, value);
            }
         }
      });
   }

   setAndSave(data = null)
   {
      return new Promise((resolve) =>
      {
         this.set(data);
         resolve(this.save());
      });
   }

   setAndSaveImages(images = [])
   {
      return new Promise((resolve, reject) =>
      {
         if (_.isUndefined(images) || !_.isArray(images))
         {
            throw new TypeError('setAndSaveImages - images is undefined or is not an array.');
         }

         const user = Parse.User.current();

         if (user === null)
         {
            throw new Error('setAndSaveImages - no current user.');
         }

         if (images.length === 0)
         {
            resolve();
         }

         const imageMap = new Map();
         const imageFileArray = [];

         _.each(images, (image, index) =>
         {
            let mimeType = null;
            let extension = null;

            try
            {
               mimeType = image.src.match(/^data:(.*?);/)[1];
               extension = mimeType.split('/')[1];
            }
            catch(error) { /* ignore */ }

            if (Object.prototype.toString.call(image) !== '[object HTMLImageElement]' || mimeType === null ||
             extension === null)
            {
               throw new Error(`setAndSaveImages - value at index '${index}' is not a HTMLImageElement or mimeType /
                extension could not be determined.`);
            }

            const filename = `photo-${image.width}px.${extension}`;

            const file = new Parse.File(filename,
             { base64: image.src.replace(/^data:image\/(png|jpeg|jpg|gif|bmp);base64,/, '') }, mimeType);

            imageMap.set(`image${image.width}px`, file);
            imageFileArray.push(file);
         });

         // save all the newly created objects
         Parse.Object.saveAll(imageFileArray).then(() =>
         {
            imageMap.forEach((value, key) =>
            {
               user.set(key, value);
            });

            return user.save();
         }).then(() =>
         {
            const imageKeys = [...imageMap.keys()];

            eventbus.trigger('typhon:user:current:images:changed', imageKeys);

            resolve(imageKeys);
         },
         (error) =>
         {
            reject(error);
         });
      });
   }

   signUpUser(data = {})
   {
      return new Promise((resolve, reject) =>
      {
         if (!_.isObject(data))
         {
            throw new TypeError('signUpUser - data is not an object.');
         }

         if (!_.isString(data.name))
         {
            throw new TypeError('signUpUser - data.name is not a string or null.');
         }

         if (!_.isString(data.password))
         {
            throw new TypeError('signUpUser - data.password is not a string or null.');
         }

         if (!_.isString(data.email))
         {
            throw new TypeError('signUpUser - data.email is not a string or null.');
         }

         Parse.User.signUp(data.name, data.password, { email: data.email, ACL: new Parse.ACL() }).then((user) =>
         {
            if (user !== null)
            {
               eventbus.triggerFirst('maindatactrl:add', 'typhon:user:current', user, 60000);

               // Save most recent login date
               user.set('lastLoginAt', new Date());
               user.save();

               // Identify the user and emit an event with the current user identity.
               eventbus.trigger('typhon:user:current:identity',
               {
                  email: user.getEmail(),
                  name: user.escape('username'),
                  created_at: user.createdAt.getTime(),
                  id: user.id
               });
            }
            resolve(user !== null);
         },
         (error) =>
         {
            reject(error);
         });
      });
   }

   toJSON()
   {
      const user = Parse.User.current();

      if (user === null)
      {
         throw new Error('toJSON - no current user.');
      }

      return user.toJSON();
   }
}

export default new TyphonUser();