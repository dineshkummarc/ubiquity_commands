Components.utils.import('resource://xmpp4moz/xmpp.jsm');
Components.utils.import('resource://xmpp4moz/namespaces.jsm');
var srvIO = Cc['@mozilla.org/network/io-service;1']
    .getService(Ci.nsIIOService);

var $ = jQuery;

var Contact = {
    _name : 'contact',

    get contacts() {
        var rosters = XMPP.cache.all(
            XMPP.q()
                .event('iq')
                .direction('in')
                .type('result')
                .child(ns_roster, 'query'));

        var contacts = [];
        for each(var roster in rosters) {
            for each(var item in roster.stanza..ns_roster::item) {
                contacts.push({
                    account : roster.account,
                    address : item.@jid.toString(),
                    name    : item.@name.toString()
                });
            }
        }
        return contacts;
    },

    suggest: function(text, html, makeSuggestion) {
        text = text.toLowerCase();

        return this.contacts
            .filter(function(contact) {
                return (contact.name.toLowerCase().indexOf(text) != -1 ||
                        contact.address.toLowerCase().indexOf(text) != -1);
            })
            .map(function(contact) {
                return {
                    text    : contact.name || contact.address,
                    summary : contact.name || XMPP.JID(contact.address).node,
                    html    : contact.name,
                    data    : contact
                }
            });
    }
};

CmdUtils.CreateCommand({
    name: 'im',
    icon: 'chrome://sameplace/skin/logo16x16.png',
    description: 'Open chat in SamePlace',
    author: { name: 'Irakli Gozalishvili', email: 'rfobic@gmail.com'},
    contributors: [ 'Massimiliano Mirra' ],
    homepage: 'http://rfobic.wordpress.com/',
    help: 'Type "im" and contact name to open a chat',
    takes: {'contact': Contact},

    preview: function(pblock, noun, modifiers) {
        var name = noun.data.name || XMPP.JID(noun.data.address).node;
        var account = noun.data.account;
        var address = noun.data.address;

        var presence = XMPP.presencesOf(account, address)[0];
        var imgUrl;
        if(!presence || presence.stanza.@type == 'unavailable')
            imgUrl = 'resource://sameplace/icons/status16x16-unavailable.png';
        else if(presence.stanza.show == 'away')
            imgUrl = 'resource://sameplace/icons/status16x16-away.png';
        else if(presence.stanza.show == 'dnd')
            imgUrl = 'resource://sameplace/icons/status16x16-dnd.png';
        else if(presence.stanza.@type == undefined)
            imgUrl = 'resource://sameplace/icons/status16x16-available.png';

        pblock.innerHTML = <div>Open chat with <img src={imgUrl}/>{name} (<em>{address}</em>)</div>;
    },

    execute: function(noun) {
        srvIO.newChannel('xmpp://' + noun.data.account + '/' + noun.data.address,
                         null, null)
            .asyncOpen(null, null);
    }
});
