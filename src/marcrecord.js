function MarcRecord(marc) {
    this._marc = marc;  // _marc is used for initialization.  _fields is the authoritative data.
    this._fields = [];

    // BIB types:
    // positions 6 & 7 in LDR.
    var rtype_re = {
        BKS : /[at]{1}[acdm]{1}/,      // LOC BK
        COM : /[m]{1}[abcdmsi]{1}/,    // LOC CF
        MAP : /[ef]{1}[abcdmsi]{1}/,   // LOC MP
        MIX : /[p]{1}[cdi]{1}/,        // LOC MX
        REC : /[ij]{1}[abcdmsi]{1}/,   // LOC MU
        SCO : /[cd]{1}[abcdmsi]{1}/,   // LOC MU (Score separate from SoundRec for OCLC)
        SER : /[a]{1}[bsi]{1}/,        // LOC CNR (Continuing Resource)
        VIS : /[gkro]{1}[abcdmsi]{1}/  // LOC VM
    };
    // Additional record types ...
    rtype_re.AUTH = /[z]{1}.{1}/ ;  // Authority Record.
    rtype_re.MFHD = /[uvxy]{1}.{1}/ ;  // MFHD Record.

    function MarcField(field, field_data){

        // See init block for initialization

        this._subfields_clone = function(f){
            //returns a copy of subfields object.
            var clone = [];
            var source = (f) ? f : this;  // allow cloning non-MarcField objects.
            for(var i=0; i<source.subfield_data.length; i++){
                clone.push( { code: source.subfield_data[i].code , value: source.subfield_data[i].value } );
            }
            return clone;
        };

        this.subfields = function(filterspec, options){
            // filterspec is simply a list of subfields.  e.g. 'abhjm'.
            // options:  { reorder: bool }.
            // Note filterspec order does not influence return value unless options.reorder is true.
            // subfields that match are returned in the order they appear in the record.

            if(this.is_control_field()) return null;
//            if(!filterspec) return this._subfields_clone();
            if(!filterspec) return this.subfield_data;
            // Without filtering, we return the actual subfield data (which could be altered by caller)
            // but we return a copy if it's filtered.  Not ideal.
            // maybe we should offer option of returning a clone.

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
        this.subfield_at = function(i){
            //return subfield i.
            if( i < this.subfield_data.length){
                return { code: this.subfield_data[i].code, value: this.subfield_data[i].value};
            } else {
                return null;
            }
        };
        this.add_subfield = function(index, data) {
            // Creates a new subfield object, inserts it into record BEFORE specified index
            // and returns it.  Will add to end if index == -1.
            // data can be a subfield object or just the subfield code.

            var newSubfield = (typeof data == 'object') ? {code: data.code, value: data.value} : {code: data, value: ''};
            if(index < 0 || index > this.subfield_data.length) index = this.subfield_data.length;
            this.subfield_data.splice(index||0, 0, newSubfield);
            return newSubfield;
        };

        this.delete_subfield = function(index){
            return this.subfield_data.splice(index,1)[0];
        };

        this.replace = function(newData, pos){
            if(this.is_control_field()){
                // newData should be a str, optional pos for splice.
                if (typeof pos === 'undefined') {
                    this.data = newData;
                } else {
                    var range = pos.match(/\d+/g); // format: '[11]' or '[11-14]'
                    if(!range) return;
                    var len = (range[1]) ? parseInt(range[1],10) - parseInt(range[0],10) + 1 : 1;
                    // right-pad with spaces if newData is short.
                    if(newData.length != len){
                        newData = (newData + '                 ').substr(0,len);
                    }
                    this.data = (this.data + '                                        ').substr(0,range[0]) +
                                    newData + this.data.substr( parseInt(range[0],10) + len );
                }

            } else {
                // replaces subfield data with newData's.
                // hack -- allow _subfields_clone() to behave like a class method.
                this.subfield_data = (newData._subfields_clone) ? newData._subfields_clone() : this._subfields_clone(newData);
                this.ind1 = newData.ind1;
                this.ind2 = newData.ind2;
                this.tag = newData.tag;

            }
            return this;
        };
        this.replace_subfield = function(index, data){
            if(index < this.subfield_data.length){
                this.subfield_data[index] = {code: data.code, value: data.value};
            }
        };

        this.is_control_field = function(){
            return (this.tag < '010') ? true : false;
        };
        this.index = function(){
            // return field's index in the record.
            for (var i = 0; i < this.record._fields.length; i++) {
                if(this.record._fields[i]===this) return i;
            }
        };
        this.del = function(){
            for (var i = 0; i < this.record._fields.length; i++) {
                if(this.record._fields[i]===this){
                    this.record.delete_field(i);
                    return;
                }
            }
        };
        this.clone = function(){
            var field_data = {
                ind1 : this.ind1,
                ind2: this.ind2,
                subfields: []
            };
            for(var i=0; i<this.subfield_data.length; i++){
                field_data.subfields.push(this.subfield_data[i].code);
                field_data.subfields.push(this.subfield_data[i].value);
            }

            return new MarcField(this.field, field_data);
        };

        // Object initialization

        // we store subfields as an array of objects with properties code & value
        // to simplify sorting.  The external format is an interleaved array of code, value pairs.

        this.tag = field;
        this.subfield_data = [];
        this.data = '';

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

    // MarcRecord object initialization
    this._fields = [ new MarcField('000', marc.leader) ];
    this._fields[0].record = this;

    for (var i = 0; i < marc.fields.length-1; i+=2) {
        var field = new MarcField(marc.fields[i], marc.fields[i+1]);
        field.record = this;
        this._fields.push(field);
    }

    this.leader = function() {
        // FIXME relies on ordering.
        return this._fields[0].data || '';
    };

    this.fields = function(tag) {
        var out = [];
        var tag_re = new RegExp(tag);
        for (var i = 0; i < this._fields.length; i++) {
            if(tag_re.test(this._fields[i].tag)){
                out.push(this._fields[i]);
            }
        }
        return out;
    };

    this.field = function(tag) {
        var matched_fields = this.fields(tag);
        return (matched_fields.length === 0) ? null : matched_fields[0];
    };

    this.add_field = function(tag, index) {
        // Creates a new MarcField object, inserts it into record BEFORE specified index
        // and returns it.  Will add in numeric order if index isn't passed.  (Also, you can't pass 0).

        var field_data = (tag < '010') ? '' : { subfields: ['', '']};
        var newField = new MarcField(tag, field_data);
        newField.record = this;
        if(!index){
            var last_tag = '';
            for (var i = 0; i < this._fields.length; i++) {
                index=i;
                if(last_tag < tag && this._fields[i].tag > tag){
                    break;
                }
                last_tag = this._fields[i].tag;
            }
        } else if(index >= this._fields.length){
            index = this._fields.length;
        }
        this._fields.splice(index, 0, newField);
        return newField;
    };

    this.delete_field = function(index){
        return this._fields.splice(index,1)[0];
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
        if(!field) return null;
        return (field.subfield('a')||'').replace(/\s*[\/:\.,;]\s*/,'');
    };

    this.toJSON = function(){
        var out = { leader: this.leader(), fields: []};
        for (var i = 0; i < this._fields.length; i++) {
            if(this._fields[i].tag == '000') continue;
            out.fields.push( this._fields[i].tag );
            if(this._fields[i].is_control_field()){
                out.fields.push( this._fields[i].data );
            } else {
                var sf = { ind1: this._fields[i].ind1,
                    ind2: this._fields[i].ind2,
                    subfields: []
                    };
                for (var j = 0; j < this._fields[i].subfield_data.length; j++) {
                    sf.subfields.push(this._fields[i].subfield_data[j].code);
                    sf.subfields.push(this._fields[i].subfield_data[j].value);
                }
                out.fields.push( sf );
            }
        }
        return out;
    };

    this.toString = function(){
        var out = '';
        for(var i=0; i<this._fields.length; i++){
            out += this._fields[i].tag;
            if(this._fields[i].is_control_field()){
                out += ' ' + this._fields[i].data;
            } else {
                out += ' ' + this._fields[i].ind1 || ' ' + this._fields[i].ind2 || ' ';
                for (var j = 0; j < this._fields[i].subfield_data.length; j++) {
                    out += " $" + this._fields[i].subfield_data[j].code;
                    out += this._fields[i].subfield_data[j].value;
                }
            }
            out += "\n";
        }
        return out;
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
    * @param {string} setter value.
    * @returns {string} The control field's value or a substring derived from it.
    */
    this.ctrl = function(ctrlspec) {
        var tag = ctrlspec.substr(0, 3);
        var pos = ctrlspec.substr(4).replace(/\[|\]/g, '').split(/-/);
        var len = (pos[1]) ? pos[1] - pos[0] + 1 : 1;

        if(tag && tag < '010'){
            if(!this.field(tag)) return null;
            if (pos[0] === '') {
                return this.field(tag).data;
            } else {
                return this.field(tag).data.substr(pos[0], len);
            }
        } else {
            return null;
        }

    };

    /**
    * @returns {string} The OCLC Code for Record Type (bibs), or 'AUTH' or 'MFHD'  (See rtype_re for definition)
    */
    this.rtype = function(){
        var type_blvl = this.leader().substr(6,2);
        for (var t in rtype_re) {
            if (rtype_re[t].test(type_blvl)) return t;
        }
        return null;
    };

    this.format = (this.rtype() == 'AUTH') ? 'auth' :
                        (this.rtype() == 'MFHD') ? 'mfhd' :'bib';

    this.rcn = function(){
        if(this.rtype()!='AUTH') return null;
        return '(' + (this.field('003')||{}).data + ')' + (this.field('001')||{}).data;
    };

}
