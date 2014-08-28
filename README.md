marcrecord-js
=============

marcrecord.js is a lightweight javascript library for working with MARC bibliographic data.
It uses the [MARC-JSON format](http://search.cpan.org/~cfouts/MARC-File-JSON-0.003/lib/MARC/File/JSON.pm) externally, and allows mutation, inspection and html representation of MARC data.

```javascript

> var marcjson = {
    leader: "01033cam a22003378a 4500",
    fields: [
        "001", "00001",
        "260", { ind1: "3", ind2: " ", subfields: [ "a", "Portland, Oregon", "c", "2014" ]
        },
        "100", { ind1: "3", ind2: " ", subfields: [ "a", "Anonymous" ]
        },
        "245", { ind1: "0", ind2: "2", subfields: [ "a", "A Title:", "b", "of sorts" ]
        },
        "355", { ind1: "0", ind2: " ", subfields: [ "a", "Confidential" ]
        },
        "355", { ind1: "5", ind2: " ", subfields: [ "a", "Unrestricted" ]
        }
    ]
};

> var record = new MarcRecord(marcjson);

> record.ctrl('000[6]')
    "a"

> record.leader().substr(6,2)
    "am"

> record.ctrl('000[6-8]')
    "am "

> record.rtype()
    "BKS"

> record.format
    "bib"

> record.title()
    "A Title"

> record.subfield('245a')
    "A Title:"

> record.has('700')
    false

> record.has('100')
    true

> record.field('260').html()
    <span class="marcfield marc260 marc2XX marc-i13 marc-i2">
        <span class="subfield marc260a">Portland, Oregon</span>
        <span class="subfield marc260c">2014</span>
    </span>

> record.field('260').html({ filter: 'c' })
    <span class="marcfield marc260 marc2XX marc-i13 marc-i2">
        <span class="subfield marc260c">2014</span>
    </span>

> var record_releasability;
> record.fields('355').forEach(function(field){ if(field.ind1 == '5') record_releasability = field.subfield('a'); });
> record_releasability
    "Unrestricted"

```

API documentation is available [here](https://github.com/liblime/marcrecord-js/blob/master/doc/MarcRecord.html).

Licenced under the [3-clause BSD license](https://github.com/liblime/marcrecord-js/blob/master/LICENSE.txt).

_Copyright 2014 PTFS/LibLime_

