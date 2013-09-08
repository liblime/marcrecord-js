function MarcRecord(marc) {
    this.marc = marc;

    function MarcField(field, field_data){
        this.tag = field;
        if(typeof field_data === 'object'){
            this.ind1 = field_data.ind1;
            this.ind2 = field_data.ind2;
            this.subfield_data = field_data.subfields;
        } else if(typeof field_data === 'string'){
            // assume control fields
            this.data = field_data;
        }

        this.subfields = function(filterspec){
            // filterspec is simply a list of subfields.  e.g. 'abhjm'.
            // Note filterspec order does not influence return value.
            // subfields that match are returned in the order they appear in the record.

            if(!filterspec) return this.subfield_data;  // FIXME: should return copy.
            var needles = filterspec;
            var haystack = this.subfield_data;
            var newsubfields = [];
            for (var i = 0; i < haystack.length-1; i+=2) {
                for (var j = 0; j < needles.length; j++) {
                    if (haystack[i] === needles[j]) {
                        newsubfields.push(haystack[i], haystack[i+1]);
                        break;
                    }
                }
            }
            return newsubfields;
        };

        this.indicator = function(i){
            return this['ind'+parseInt(i,10)];
        };

        this.filter = function(filterspec){
            //filters out all subfields not included in filterspec.
            // filterspec is simply a list of subfields.  e.g. 'abhjm'.

            this.subfield_data = this.subfields(filterspec);
            return this;
        };

        this.html = function(options){
            // output the field as a marc-html string.
            // options:
            // { filterEach : specify a filter function to pass each subfield through
            //      filterLast : apply filter function to last subfield.
            //      delimiter : character(s) to insert between subfields.
            //              //  This is only here for IE7.  else, css pseudoelements would work.
            // }
            if(!options) options = { delimiter: null };
            var i1 = (!this.ind1 || this.ind1 === ' ' || this.ind1 === '#') ? '' : this.ind1;
            var i2 = (!this.ind2 || this.ind2 === ' ' || this.ind2 === '#') ? '' : this.ind2;
            var output = '<span class="marcfield marc' +this.tag + ' ' +
                         'marc' + this.tag.substring(0,1) +'XX marc-i1'+i1+ ' marc-i2'+ i2 +'">';

            if(this.subfield_data.length){
                for (var i = 0; i < this.subfield_data.length-1; i+=2) {
                    var subf = this.subfield_data[i];
                    var value = this.subfield_data[i+1];
                    if(options.filterEach && typeof options.filterEach === 'function'){
                        value = options.filterEach(value);
                      }
                    if(options.filterLast && typeof options.filterLast === 'function' && i == this.subfield_data.length-2){
                        value = options.filterLast(value);
                    }
                    output += "<span class=\"subfield marc" + this.tag + subf + "\">" + value + "</span>";
                    if( options.delimiter && i < this.subfield_data.length - 2) output += options.delimiter;
                }
            } else {
                output += "<span class='subfield nodata'></span>";
            }

            return output + '</span>';

        };
        this.subfield = function(subfield){
            // ouput subfield value as text.
            // if subfield is repeated, only outputs the first value.
            var matched = this.subfields(subfield);
            return (matched.length) ? matched[1] : null;
        };
        this.m880 = function(){
            // returns array of associated 880 MarcField objects.

        };
        this.rcn = function(){
            // convenience method, equivalent to this.subfield('0');
            return this.subfield('0');
        };
        this.is_control_field = function(){
            return this.data && this.tag < '010';
        };

    }


    this.leader = function() {
        return this.marc.leader;
    };

    this.fields = function(tag) {
        var out = [];
        var tag_re = new RegExp(tag);
        for (var i = 0; i < this.marc.fields.length-1; i+=2) {
            if ( tag_re.test(this.marc.fields[i]) ) {
                out.push(new MarcField(this.marc.fields[i], this.marc.fields[i+1]));
            }
        }
        return out;
    };

    this.field = function(tag) {
        var fields = this.fields(tag);
        return (fields.length === 0) ? null : fields[0];
    };

    this.has = function (tag) {
        // TODO: accept a tagspec here.
        return this.fields(tag).length > 0;
    };

    this.subfield = function(tagspec) {
        // convenience method.
        // marc.subfield('100a') === marc.field('100').subfield('a')
        var field = this.field(tagspec.substr(0,3));
        return (field) ? field.subfield(tagspec.substr(3,1)) : null;

    };

    this.title = function(){
        var field = this.field('245');
        return field.subfield('a') + ' ' + field.subfield('b');
    };

    this.coins = function(){
        // returns an html span with COinS in title attribute.
        // FIXME: assume book format.
        var fmt = 'book';
        var coinsdata = {
            ctx_ver : "Z39.88-2004",
            rft_val_fmt : "info:ofi/fmt:kev:mtx:" + fmt,
            "rft.btitle"  : this.title(),
        };
        if(this.subfield('020a')) coinsdata['rft.isbn'] = this.subfield('020a');
        if(this.subfield('022a')) coinsdata['rft.issn'] = this.subfield('022a');
        var authors = [];
        if(this.subfield('100a')) authors.push(this.subfield('100a'));
        this.fields('700').forEach(function(f){ authors.push(f.subfield('a'));});
        coinsdata['rtf.au'] = authors;
        if(this.subfield('260b')) coinsdata['rft.pub'] = this.subfield('260b');
        if(this.subfield('260c')) coinsdata['rft.date'] = this.subfield('260c');
        var title_attr = '';
        if(typeof jQuery === 'function'){
            title_attr = jQuery.param(coinsdata);
        } else {
            console.warn('COinS requires jQuery.');
        }
        return title_attr;

    };
    this.ctrl = function(ctrlspec) {
        var tag = ctrlspec.substr(0, 3);
        var pos = ctrlspec.substr(4).replace(/\[|\]/g, '').split(/-/);
        if (pos[0] === '') {
            return this.field(tag).data;
        }
        else if (pos.length === 1) {
            return this.field(tag).data.substr(pos[0], 1);
        }
        else if (pos.length === 2) {
            return this.field(tag).data.substr(pos[0], pos[1] - pos[0] + 1);
        }
    };
}
