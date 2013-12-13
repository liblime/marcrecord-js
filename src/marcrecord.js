function MarcRecord(marc) {
    this.marc = marc;

    function MarcField(field, field_data){

        // See init block for initialization

        this._subfields_clone = function(){
            //returns a copy of subfields object.
            var clone = [];
            for(var i=0; i<this.subfield_data.length; i++){
                clone.push( { code: this.subfield_data[i].code , value: this.subfield_data[i].value } );
            }
            return clone;
        };

        this.subfields = function(filterspec, options){
            // filterspec is simply a list of subfields.  e.g. 'abhjm'.
            // options:  { reorder: bool }.
            // Note filterspec order does not influence return value unless options.reorder is true.
            // subfields that match are returned in the order they appear in the record.

            if(this.is_control_field()) return null;
            if(!filterspec) return this._subfields_clone();  // FIXME: should return copy.
            if(!options) options = {};
            var needles = filterspec;
            var haystack = (options.reorder) ?
                    this.subfield_data.sort(function(a,b){
                            if (filterspec.indexOf(a.code)==-1 || filterspec.indexOf(b.code) < filterspec.indexOf(a.code)) return 1;
                            return -1;
                        })
                    : this.subfield_data;
            var newsubfields = [];

            for(var i=0; i< haystack.length; i++){
                for (var j = 0; j < needles.length; j++) {
                    if (haystack[i].code === needles[j]) {
                        newsubfields.push({ code: haystack[i].code, value: haystack[i].value });
                        break;
                    }
                }
            }

            return newsubfields;
        };

        this.indicator = function(i){
            return this['ind'+parseInt(i,10)];
        };

        this.html = function(options){
            // output the field as a marc-html string.
            // options:
            // { filterEach : specify a filter function to pass each subfield through
            //      filterLast : apply filter function to last subfield.
            //      delimiter : character(s) to insert between subfields.
            //              //  This is only here for IE7.  else, css pseudoelements would work.
            //      filter : only include these subfields.
            //      reorder : reorder by order in filter param.
            // }
            if(!options) options = { delimiter: null };
            var i1 = (!this.ind1 || this.ind1 === ' ' || this.ind1 === '#') ? '' : this.ind1;
            var i2 = (!this.ind2 || this.ind2 === ' ' || this.ind2 === '#') ? '' : this.ind2;

            var data_rcn = (this.rcn) ? 'data-rcn="' + this.rcn + '" ' : '';
            // arguably we should put indicators in data- attrs as well, but we stash them in classes for styling.
            var output = '<span '+ data_rcn + 'class="marcfield marc' +this.tag + ' ' +
                         'marc' + this.tag.substring(0,1) +'XX marc-i1'+i1+ ' marc-i2'+ i2 +'">';

            if(this.subfield_data.length){
                var target_subfields = this.subfields(options.filter, { reorder: options.reorder });
                if(target_subfields.length){
                    for( var i = 0; i < target_subfields.length; i++){
                        var subf = target_subfields[i].code;
                        var value = target_subfields[i].value;
                        if(options.filterEach && typeof options.filterEach === 'function'){
                            value = options.filterEach(value);
                          }
                        if(options.filterLast && typeof options.filterLast === 'function' && i == target_subfields.length-1){
                            value = options.filterLast(value);
                        }
                        var classnames = "subfield marc" + this.tag + subf;
                        output += '<span class="' + classnames + '">' + value + "</span>";
                        if( options.delimiter && i < target_subfields.length - 1) output += options.delimiter;
                    }
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
            return (matched.length) ? matched[0].value : null;
        };
        this.m880 = function(){
            // returns array of associated 880 MarcField objects.

        };

        this.is_control_field = function(){
            return (this.data && this.tag < '010') ? true : false;
        };

        // Object initialization

        // we store subfields as an array of 2-element arrays [ code, value ]
        // to simplify sorting.  The external format is an interleaved array of code, value pairs.

        this.tag = field;
        this.subfield_data = [];
        if(typeof field_data === 'object'){
            this.ind1 = field_data.ind1;
            this.ind2 = field_data.ind2;
            for (var i = 0; i < field_data.subfields.length-1; i+=2 ){
                this.subfield_data.push( { code: field_data.subfields[i], value: field_data.subfields[i+1] });
            }
            // store control subfields in case they're filtered later.
            // todo: $6, $8.
            this.rcn = this.subfield('0');

        } else if(typeof field_data === 'string'){
            // assume control fields
            this.data = field_data;
        }

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
        var matched_fields = this.fields(tag);
        return (matched_fields.length === 0) ? null : matched_fields[0];
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
    /**
    * @param {string} ctrlspec A specifier indicating control field's tag, and optionally,
    * a substring to select from the field data. <br/>Examples:
    * <ul><li>ctrl('008')</li><li>ctrl('008[7]')  // position 7.</li><li>ctrl('008[7-8]') // positions 7&8</li></ul>
    * @returns {string} The control field's value or a substring derived from it.
    */
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
