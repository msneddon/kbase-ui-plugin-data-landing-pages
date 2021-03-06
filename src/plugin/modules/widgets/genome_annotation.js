/*global define */
/*jslint white: true, browser: true */
define([
    'jquery',
    'datatables',
    'datatables_bootstrap',
    'kb/common/html',
    'kb/data/genomeAnnotation',
    'kb/data/taxon',
    'kb/data/assembly',
    '../utils',
    'numeral',
    'handlebars',
    'plotly'
],
    function ($,
              datatables,
              datatables_bootstrap,
              html,
              GenomeAnnotation,
              Taxon,
              Assembly,
              utils,
              numeral,
              handlebars,
              plotly) {
        'use strict';

        function factory(config) {
            var parent,
                container,
                filters = {
                    "type_list": [],
                    "region_list": [],
                    "function_list": [],
                    "alias_list": []
                    },
                genomeAnnotation,
                annotation_data = {},
                runtime = config.runtime,
                div = html.tag('div'),
                panelTemplates = {
                    overview: handlebars.compile("<div class='row'>"
                            + "    <div class='col-md-6'>"
                            + "        <div class='lp_summary_box'>"
                            + "            <h4>Source Information</h4>"
                            + "            <table class='table'>"
                            + "                <tr>"
                            + "                    <td><b>Annotation Source</b></td>"
                            + "                    <td data-element='externalSource'></td>"
                            + "                </tr>"
                            + "                <tr>"
                            + "                    <td><b>Annotation Source Date</b></td>"
                            + "                    <td data-element='externalSourceDate'></td>"
                            + "                </tr>"
                            + "                <tr>"
                            + "                    <td><b>Annotation Data Release</b></td>"
                            + "                    <td data-element='dataRelease'></td>"
                            + "                </tr>"
                            + "                <tr>"
                            + "                    <td><b>Original Annotation File Name</b></td>"
                            + "                    <td data-element='originalFilename'></td>"
                            + "                </tr>"
                            + "                <tr>"
                            + "                    <td><b>Assembly Source</b></td>"
                            + "                    <td data-element='assemblySource'></td>"
                            + "                </tr>"
                            + "                <tr>"
                            + "                    <td><b>Assembly Source Date</b></td>"
                            + "                    <td data-element='assemblySourceDate'></td>"
                            + "                </tr>"
                            + "                <tr>"
                            + "                    <td><b>Assembly Identifier</b></td>"
                            + "                    <td data-element='assemblyID'></td>"
                            + "                </tr>"
                            + "            </table>"
                            + "        </div>"
                            + "        <div class='lp_summary_box'>"
                            + "            <h4>Genome Features</h4>"
                            + "            <table class='table' data-element='featureTypeCounts'>"
                            + "            </table>"
                            + "        </div>"
                            + "        <!--<div class='lp_summary_box'>"
                            + "            <h4>Functional Categories</h4>"
                            + "            <table class='table' data-element='functionalCategories'>"
                            + "            </table>"
                            + "        </div>-->"
                            + "    </div>"
                            + "    <div class='col-md-6'>"
                            + "        <div class='lp_summary_box'>"
                            + "            <h4>Organism Identity</h4>"
                            + "            <table class='table'>"
                            + "                <caption><strong><span data-element='taxonLink'></span></strong></caption>"
                            + "                <tr>"
                            + "                    <td><b>NCBI taxonomic ID</b></td>"
                            + "                    <td data-element='taxonId'></td>"
                            + "                </tr>"
                            + "                <tr>"
                            + "                    <td><b>Scientific Name</b></td>"
                            + "                    <td data-element='taxonName'></td>"
                            + "                </tr>"
                            + "                <tr>"
                            + "                    <td><b>Kingdom</b></td>"
                            + "                    <td data-element='kingdom'></td>"
                            + "                </tr>"
                            + "                <tr>"
                            + "                    <td><b>Genetic Code</b></td>"
                            + "                    <td data-element='geneticCode'></td>"
                            + "                </tr>"
                            + "                <tr>"
                            + "                    <td><b>Aliases</b></td>"
                            + "                    <td data-element='aliases'></td>"
                            + "                </tr>"
                            + "            </table>"
                            + "        </div>"
                            + "        <div class='lp_summary_box'>"
                            + "            <h4>Assembly Information</h4>"
                            + "            <table class='table'>"
                            + "                <caption><strong><span data-element='assemblyLink'></span></strong></caption>"
                            + "                <tr>"
                            + "                    <td><b>Number of Contigs</b></td>"
                            + "                    <td data-element='numContigs'></td>"
                            + "                </tr>"
                            + "                <tr>"
                            + "                    <td><b>Total DNA Size</b></td>"
                            + "                    <td data-element='dnaSize'></td>"
                            + "                </tr>"
                            + "                <tr>"
                            + "                    <td><b>GC %</b></td>"
                            + "                    <td data-element='gc'></td>"
                            + "                </tr>"
                            + "            </table>"
                            + "        </div>"
                            + "    </div>"
                            + "</div>"),
                    filters: handlebars.compile("    <div class='col-md-12' id='filter_panel'>"
                                              + "        <div id='active_filters'>"
                                              + "            <div class='col-md-3'>"
                                              + "                <div class='col-md-12'>"
                                              + "                    <strong>Types</strong>"
                                              + "                </div>"
                                              + "                <div class='col-md-12' data-element='active_feature_types'></div>"
                                              + "                    <div class='form-horizontal hidden'>"
                                              + "                        <div class='form-group'>"
                                              + "                            {{#each featureTypes}}"
                                              + "                            <label class='checkbox-inline'>"
                                              + "                                <input type='checkbox' value='{{this}}'>{{this}}</input>"
                                              + "                            </label>"
                                              + "                            {{/each}}"
                                              + "                        </div>"
                                              + "                    </div>"
                                              + "                </div>"
                                              + "            </div>"
                                              + "            <div class='col-md-3'>"
                                              + "                <div class='col-md-12'>"
                                              + "                    <strong>Regions</strong>"
                                              + "                </div>"
                                              + "                <div class='col-md-12' data-element='active_feature_regions'></div>"
                                              + "                <div class='col-md-8 form-horizontal hidden'>"
                                              + "                    <div class='form-group'>"
                                              + "                        <label for='contig_select' class='col-sm-2 control-label'>Contig</label>"
                                              + "                        <select class='form-control' id='contig_select'>"
                                              + "                        {{#each contigIds}}"
                                              + "                            <option value='{{this}}'>{{this}}</option>"
                                              + "                        {{/each}}"
                                              + "                        </select>"
                                              + "                        <div class='radio'>"
                                              + "                            <label>"
                                              + "                                <input type='radio' value='+' name='strand_type' checked>+</input>"
                                              + "                            </label>"
                                              + "                        </div>"
                                              + "                        <div class='radio'>"
                                              + "                            <label>"
                                              + "                                <input type='radio' value='-' name='strand_type'>-</input>"
                                              + "                            </label>"
                                              + "                        </div>"
                                              + "                        <label for='region_start' class='col-sm-2 control-label'>Start</label>"
                                              + "                        <input type='number' class='form-control' placeholder='start' id='region_start' min='0' value='0'></input>"
                                              + "                        <label for='region_length' class='col-sm-2 control-label'>Length</label>"
                                              + "                        <input type='number' class='form-control' placeholder='length' id='region_start' min='0' value='100'></input>"
                                              + "                        <button class='btn btn-default'>Add</button>"
                                              + "                    </div>"
                                              + "                </div>"
                                              + "            </div>"
                                              + "            <div class='col-md-3'>"
                                              + "                <div class='col-md-12'>"
                                              + "                    <strong>Functions</strong>"
                                              + "                    <button class='btn-xs btn-primary' type='button' data-toggle='collapse' data-target='add_function_filter' aria-expanded='false' aria-controls='add_function_filter'><span class='glyphicon glyphicon-plus'></span></button>"
                                              + "                </div>"
                                              + "                <div class='col-md-12' data-element='active_feature_functions'></div>"
                                              + "                <div class='col-md-8 form-horizontal collapse' id='add_function_filter'>"
                                              + "                    <div class='form-group'>"
                                              + "                        <input type='text' class='form-control' placeholder='function text here'></input>"
                                              + "                        <button class='btn btn-default'>Add</button>"
                                              + "                    </div>"
                                              + "                </div>"
                                              + "            </div>"
                                              + "            <div class='col-md-3'>"
                                              + "                <div class='col-md-12'>"
                                              + "                    <strong>Aliases</strong>"
                                              + "                </div>"
                                              + "                <div class='col-md-12' data-element='active_feature_aliases'></div>"
                                              + "                <div class='col-md-8 form-horizontal hidden'>"
                                              + "                    <div class='form-group'>"
                                              + "                        <input type='text' class='form-control' placeholder='alias text here'></input>"
                                              + "                        <button class='btn btn-default'>Add</button>"
                                              + "                    </div>"
                                              + "                </div>"
                                              + "            </div>"
                                              + "        </div>"
                                              + "<!--"
                                              + "        <form class='form-horizontal filters_form'>"
                                              + "            <fieldset>"
                                              + "                <div class='col-md-3'>"
                                              + "                    <strong>Feature Types</strong>"
                                              + "                    <select multiple class='form-control' data-element='feature_types_select'>"
                                              + "                    {{#each featureTypes}}"
                                              + "                        <option value='{{this}}'>{{this}}</option>"
                                              + "                    {{/each}}"
                                              + "                    </select>"
                                              + "                </div>"
                                              + "                <div class='col-md-3'>"
                                              + "                    <strong>Feature Regions</strong>"
                                              + "                    <select multiple class='form-control' data-element='contig_ids'>"
                                              + "                    </select>"
                                              + "                </div>"                                                  
                                              + "                <div class='col-md-12'>"
                                              + "                    <strong>Feature Functions</strong>"
                                              + "                    <input type='text' class='form-control' placeholder='function keyword strings' data-element='function_strings'>"
                                              + "                </div>"
                                              + "                <div class='col-md-12'>"
                                              + "                    <strong>Feature Aliases</strong>"
                                              + "                    <input type='text' class='form-control' placeholder='alias strings' data-element='alias_strings'>"
                                              + "                </div>"
                                              + "            </fieldset>"
                                              + "        </form>"
                                              + "-->"
                                              + "    </div>"),
                    annotations: handlebars.compile("<div class='row'>"
                                                  + "    <div class='col-md-12'>"
                                                  + "        <button class='btn btn-primary'>Inspect Feature Data</button>"
                                                  + "    </div>"
                                                  + "    <div class='col-md-12 hidden'>"
                                                  + "        <div class='col-md-2'>"
                                                  + "            <h4>Annotation Filters</h4>"
                                                  + "        </div>"
                                                  + "    </div>"
                                                  + "    <div class='col-md-12 hidden' id='filters_div'></div>"
                                                  + "    <div class='col-md-12 hidden'>"
                                                  + "        <div class='col-md-3'>"
                                                  + "            <h4>Annotations</h4>"
                                                  + "            <h5>Limited to 1,000 results</h5>"
                                                  + "        </div>"
                                                  + "    </div>"
                                                  + "    <div class='col-md-12 hidden' data-element='feature_table_div'></div>"
                                                  + "</div>"),
                    features: handlebars.compile("<div class='row'>"
                                                  + "    <div class='col-md-8' id='feature_table_container'>"
                                                  + "        <div id='no_results' class='hidden alert alert-danger' role='alert'>No results found using the current set of filters.</div>"
                                                  + "        <table class='table table-bordered table-striped' id='features_table'>"
                                                  + "            <thead>"
                                                  + "                <tr>"
                                                  + "                    <th>type</th>"
                                                  + "                    <th>contig</th>"
                                                  + "                    <th>id</th>"
                                                  + "                    <th>length</th>"
                                                  + "                    <th>function</th>"
                                                  + "                </tr>"
                                                  + "            </thead>"
                                                  + "            <tbody>"
                                                  + "                {{#each featureData}}"
                                                  + "                    <tr>"
                                                  + "                        <td>{{feature_type}}</td>"
                                                  + "                        <td>{{feature_locations.[0].contig_id}}</td>"
                                                  + "                        <td>{{feature_id}}</td>"
                                                  + "                        <td>{{feature_dna_sequence_length}}</td>"
                                                  + "                        <td>{{feature_function}}</td>"
                                                  + "                    </tr>"
                                                  + "                {{/each}}"
                                                  + "            </tbody>"
                                                  + "        </table>"
                                                  + "    </div>"
                                                  + "    <div class='col-md-4' data-element='feature_view'>"
                                                  + "        {{#each featureData}}"
                                                  + "        <div class='hidden' data-element='{{feature_id}}'>"
                                                  + "            <h4>Feature view</h4>"
                                                  + "            <div>"
                                                  + "                <strong>Locations</strong>"
                                                  + "                <table class='table'>"
                                                  + "                    <thead>"
                                                  + "                        <tr>"
                                                  + "                            <th><b>contig_id</b></th>"
                                                  + "                            <th><b>start</b></th>"
                                                  + "                            <th><b>strand</b></th>"
                                                  + "                            <th><b>length</b></th>"
                                                  + "                        </tr>"
                                                  + "                    </thead>"
                                                  + "                    <tbody>"
                                                  + "                    {{#each feature_locations}}"
                                                  + "                        <tr>"
                                                  + "                            <td>{{contig_id}}</td>"
                                                  + "                            <td>{{start}}</td>"
                                                  + "                            <td>{{strand}}</td>"
                                                  + "                            <td>{{length}}</td>"
                                                  + "                        </tr>"
                                                  + "                    {{/each}}"
                                                  + "                    </tbody>"
                                                  + "                </table>"
                                                  + "            </div>"
                                                  + "            <div style='padding-bottom: 10px;'>"
                                                  + "                <strong>DNA Sequence</strong>"
                                                  + "                <button class='btn-xs btn-primary' type='button' data-toggle='collapse' data-target='[id=\"{{feature_id}}_dna\"]' aria-expanded='false' aria-controls='{{feature_id}}_dna'><span class='glyphicon glyphicon-plus'></span></button>"
                                                  + "                <div class='well wordwrap sequence collapse' id='{{feature_id}}_dna'>{{feature_dna_sequence}}</div>"
                                                  + "            </div>"
                                                  + "            <div>"
                                                  + "                <div><strong>Aliases</strong></div>"
                                                  + "                <table class='table'>"
                                                  + "                    <thead>"
                                                  + "                        <tr>"
                                                  + "                            <th><b>Alias</b></th>"
                                                  + "                            <th><b>Sources</b></th>"
                                                  + "                        </tr>"
                                                  + "                    </thead>"
                                                  + "                    <tbody>"
                                                  + "                        {{#each feature_aliases}}"
                                                  + "                        <tr>"
                                                  + "                            <td>{{@key}}</td>"
                                                  + "                            <td>"
                                                  + "                                {{#each this}}"
                                                  + "                                <div>{{this}}</div>"
                                                  + "                                {{/each}}"
                                                  + "                            </td>"
                                                  + "                        </tr>"
                                                  + "                        {{else}}"
                                                  + "                        <tr>"
                                                  + "                            <td>No aliases present.</td>"
                                                  + "                            <td></td>"
                                                  + "                        </tr>"
                                                  + "                        {{/each}}"
                                                  + "                    </tbody>"
                                                  + "                </table>"
                                                  + "            </div>"
                                                  + "            <div>"
                                                  + "                <strong>Notes</strong>"
                                                  + "                <div class='well wordwrap'>{{feature_notes}}</div>"
                                                  + "            </div>"
                                                  + "        </div>"
                                                  + "    {{/each}}"                                                  
                                                  + "    </div>"
                                                  + "</div>"
                                                  + "</div> <!-- row-->"),
                    quality: handlebars.compile("<div class='row'>"
                                              + "</div>")
                };

            // VIEW

            function layout() {
                return div([
                    html.makePanel({
                        title: 'Genome Annotation Summary',
                        content: div({id: 'overview'}, panelTemplates.overview())
                    }),
                    html.makePanel({
                        title: 'Structural and Functional Annotations',
                        content: div({id: 'annotationInfo'}, panelTemplates.annotations())
                    })
                ]);
            }
            
            function renderFilterPanel() {
                container.querySelector("[id='filters_div']").innerHTML = panelTemplates.filters({
                    featureTypes: annotation_data.types,
                    contigIds: annotation_data.contig_ids
                });
                                
                /*
                container.querySelector("[data-element='contig_ids']").innerHTML = handlebars.compile(
                    "{{#each contigIds}}"
                    + "<option value='{{this}}'>{{this}}</option>"
                    + "{{/each}}")({contigIds: annotation_data.contig_ids});
                */
            }
            
            function renderAppliedFilters() {
                var type_display = $("[data-element='active_feature_types']"),
                    region_display = $("[data-element='active_feature_regions']"),
                    func_display = $("[data-element='active_feature_functions']"),
                    alias_display = $("[data-element='active_feature_aliases']");
                
                type_display.empty();
                for (var el in filters.type_list) {
                    type_display.append($("<span class='label label-success'><span>" +
                                          filters.type_list[el] +
                                          "</span>" +
                                          "<a onclick='removeFilter()'><i class='glyphicon glyphicon-remove-sign glyphicon-red'></i></a>" +
                                          "</span>"));
                }
                
                if (filters.type_list.length === 0) {
                    type_display.html("No type filters");
                }
                
                region_display.empty();
                for (var el in filters.region_list) {
                    region_display.append($("<span class='label label-success'>" +
                                            filters.region_list[el].contig_id +
                                            ":" +
                                            filters.region_list[el].start +
                                            ":" +
                                            filters.region_list[el].strand +
                                            ":" +
                                            filters.region_list[el].length +
                                            "</span>"));
                }

                if (filters.region_list.length === 0) {
                    region_display.html("No region filters");
                }

                func_display.empty();
                for (var el in filters.function_list) {
                    func_display.append($("<span class='label label-success'>" + filters.function_list[el] + "</span>"));
                }

                if (filters.function_list.length === 0) {
                    func_display.html("No function filters");
                }
                
                alias_display.empty();
                for (var el in filters.alias_list) {
                    alias_display.append($("<span class='label label-success'>" + filters.alias_list[el] + "</span>"));
                }                

                if (filters.alias_list.length === 0) {
                    alias_display.html("No alias filters");
                }

            }
                    
            function renderFeatureDataTable(data) {
                var formattedData = {}, i, len;

                renderFilterPanel();
                renderAppliedFilters();
                
                // format all numeric values
                for (var d in data) {
                    formattedData[d] = {};
                    for (var item in data[d]) {
                        if (String(item).indexOf('feature') != 0) {
                            continue;
                        }
                        
                        if (item === 'feature_dna_sequence_length') {
                            formattedData[d][item] = numeral(data[d][item]).format('0,0');
                        }
                        else if (item === 'feature_locations') {
                            formattedData[d].feature_locations = [];
                            for (i = 0, len = data[d].feature_locations.length; i < len; i+=1) {
                                formattedData[d].feature_locations.push({
                                    contig_id: data[d].feature_locations[i].contig_id,
                                    start: numeral(data[d].feature_locations[i].start).format('0,0'),
                                    strand: data[d].feature_locations[i].strand,
                                    length: numeral(data[d].feature_locations[i].length).format('0,0')
                                });
                            }
                        }
                        else {
                            formattedData[d][item] = data[d][item];
                        }
                    }
                }
                
                container.querySelector("[data-element='feature_table_div']").innerHTML = panelTemplates.features({
                    featureData: formattedData
                });
                
                if (data === null) {
                    $("#no_results").removeClass("hidden");
                }
                else {
                    $("#no_results").addClass("hidden");    
                }
                
                var table = $("#features_table").DataTable({lengthChange: false});

                /*
                 * Each row of the mini feature table should be clickable to pin a data preview.
                 * Mousing into a row if no row is pinned should highlight it and display the data preview.
                 * Mousing out of a row if no row is pinned should remove the highlight and remove the data
                 * preview for that row.
                 **/
                $("#features_table tbody").on('click', 'tr', function () {
                    var rowValues = table.row(this).data(),
                       pinnedElement = $(".pinned"),
                       rowDiv = $("div[data-element='" + rowValues[2] + "']");
                        
                    if (pinnedElement.length === 1 && pinnedElement[0] === rowDiv[0]) {
                        pinnedElement.removeClass('pinned').removeClass('show');
                        $(table.row(this).node()).removeClass('row_pinned');
                        return;
                    }
                    else if (pinnedElement.length == 1) {
                        $(".kb-feature-highlighted").removeClass('kb-feature-highlighted').removeClass('row_pinned');
                        pinnedElement.removeClass('pinned').removeClass('show').addClass('hidden');
                    }
                    
                    $("div[data-element='" + rowValues[2] + "']").removeClass('hidden')
                                                                 .addClass('show')
                                                                 .addClass('pinned');
                    $(table.row(this).node()).addClass('kb-feature-highlighted').addClass('row_pinned');
                }).on('mouseenter', 'tr', function () {
                    var rowValues = table.row(this).data(),
                        pinnedElement = $(".pinned");
                        
                    if (pinnedElement.length == 0) {
                        $("div[data-element='" + rowValues[2] + "']").removeClass('hidden')
                                                                     .addClass('show');    
                        $(table.row(this).node()).addClass('kb-feature-highlighted');
                    }
                    
                }).on('mouseleave', 'tr', function () {
                    var rowValues = table.row(this).data(),
                        pinnedElement = $(".pinned");
                    
                    if (pinnedElement.length == 0) {
                        $("div[data-element='" + rowValues[2] + "']").removeClass('show')
                                                                     .addClass('hidden');
                        $(".kb-feature-highlighted").removeClass('kb-feature-highlighted');
                    }
                });

                
                //setup the filter events
                $("#update_filters_button").click(function () {
                    var selected_types = $("[data-element='feature_types_select'] option:checked").toArray().map(function (e) {
                            return e.value;
                        }),
                        selected_contigs = $("[data-element='contig_ids'] option:checked").toArray().map(function (e) {
                            return e.value;
                        }),
                        selected_regions = [],
                        provided_functions = $("[data-element='function_strings']").val(),
                        provided_aliases = $("[data-element='alias_strings']").val();
                                        
                    selected_contigs.forEach(function (cid) {                        
                        selected_regions.push(
                            {contig_id: cid, strand: '-', start: 1E9, length: 1E9},
                            {contig_id: cid, strand: '+', start: 0, length: 1E9}
                        );
                    });
                                        
                    container.querySelector("[data-element='feature_table_div']").innerHTML = html.loading();
                    
                    if (selected_types.length > 0) {
                        filters.type_list = selected_types;
                    }
                    
                    if (selected_regions.length > 0) {
                        filters.region_list = selected_regions;
                    }
                    
                    if (provided_functions.length > 0) {
                        if (provided_functions.indexOf(' ') > -1) {
                            filters.function_list = provided_functions.split(' ');
                        }
                        else {
                            filters.function_list = [provided_functions];
                        }
                    }
                    
                    if (provided_aliases.length > 0) {
                        if (provided_aliases.indexOf(' ') > -1) {
                            filters.alias_list = provided_aliases.split(' ');
                        }
                        else {
                            filters.alias_list = [provided_aliases];
                        }
                    }
                                                                               
                    genomeAnnotation.feature_ids(filters).then(function (feature_ids) {
                        var flattened_ids = [], subset;
                                                
                        for (var f in feature_ids.by_type) {
                            Array.prototype.push.apply(flattened_ids, feature_ids.by_type[f]);
                        }
                        
                        subset = flattened_ids.splice(0,1000);
                        
                        if (subset.length > 0) {
                            return genomeAnnotation.features(subset);
                        }
                        else {
                            return null;
                        }
                    }).then(function (feature_data) {
                        return renderFeatureDataTable(feature_data);
                    });
                });
            }
                                    
            function renderFeatureTypesPlot(ftypes, fcounts) {
                annotation_data.types = ftypes;
                
                var data = [{
                    type: 'bar',
                    orientation: 'v',
                    x: ftypes,
                    y: fcounts
                }],
                plot_layout = {
                    title: '<b>Features</b>',
                    fontsize: 24,
                    xaxis: {
                        title: '<b>Feature Type</b>'
                    },
                    yaxis: {
                        zeroline: true,
                        title: '<b>Count</b>'
                    },
                    aspectratio: {
                        x: 4,
                        y: 3
                    }
                };
                
                container.querySelector("[id='featureTypesPlot']").innerHTML = "";
                plotly.newPlot("featureTypesPlot", data, plot_layout);
            }
            
            function renderTaxonLink(ref) {
                if (ref === null) {
                    container.querySelector('[data-element="taxonLink"]').innerHTML = "Taxon"
                }
                else {
                    container.querySelector('[data-element="taxonLink"]').innerHTML = "<a href='#dataview/" + ref + "' target='_blank'>Click here for more about this Taxon</a>";
                }
            }
            
            function renderTaxon(data) {
                /*
                 *'taxonomy': {'kingdom': 'kingdom not present', 'scientific_lineage': ['cellular organisms', 'Eukaryota', 'Rhodophyta', 'Bangiophyceae', 'Cyanidiales', 'Cyanidiaceae', 'Cyanidioschyzon', 'Cyanidioschyzon merolae'], 'scientific_name': 'Cyanidioschyzon merolae strain 10D', 'genetic_code': 1, 'taxonomy_id': 280699, 'organism_aliases': ['No organism aliases present']}
                 */
                
                var aliases = handlebars.compile("{{#each organism_aliases}}<div>{{this}}</div>{{/each}}");
                
                container.querySelector('[data-element="taxonId"]').innerHTML = data["taxonomy_id"];
                container.querySelector('[data-element="taxonName"]').innerHTML = data["scientific_name"];
                container.querySelector('[data-element="kingdom"]').innerHTML = data["kingdom"];
                container.querySelector('[data-element="geneticCode"]').innerHTML = data["genetic_code"];
                container.querySelector('[data-element="aliases"]').innerHTML = aliases({organism_aliases: data["organism_aliases"]});                
            }

            function renderAssemblyLink(ref) {
                container.querySelector('[data-element="assemblyLink"]').innerHTML = "<a href='#dataview/" + ref + "' target='_blank'>Click here for more about this Assembly</a>";
            }
            
            function renderAssembly(data) {
                /*
                 *'assembly': {'assembly_source_id': 'Red_Algae_Ensembl_2016_06_20_16_06_19.fa', 'assembly_source': 'unknown_source', 'contig_ids': ['chromosome:ASM9120v1:18:1:1253087:1', 'chromosome:ASM9120v1:20:1:1621617:1', 'chromosome:ASM9120v1:19:1:1282939:1', 'chromosome:ASM9120v1:12:1:859119:1', 'chromosome:ASM9120v1:13:1:866983:1', 'chromosome:ASM9120v1:11:1:852849:1', 'chromosome:ASM9120v1:4:1:513455:1', 'chromosome:ASM9120v1:7:1:584452:1', 'chromosome:ASM9120v1:Mito:1:32211:1', 'chromosome:ASM9120v1:10:1:839707:1', 'chromosome:ASM9120v1:5:1:528682:1', 'chromosome:ASM9120v1:Chloro:1:149987:1', 'chromosome:ASM9120v1:16:1:908485:1', 'chromosome:ASM9120v1:1:1:422616:1', 'chromosome:ASM9120v1:14:1:852727:1', 'chromosome:ASM9120v1:3:1:481791:1', 'chromosome:ASM9120v1:17:1:1232258:1', 'chromosome:ASM9120v1:15:1:902900:1', 'chromosome:ASM9120v1:9:1:810151:1', 'chromosome:ASM9120v1:6:1:536163:1', 'chromosome:ASM9120v1:8:1:739753:1', 'chromosome:ASM9120v1:2:1:457013:1'], 'num_contigs': 22, 'assembly_source_date': '01-APR-2016', 'gc_content': 0.5480838152077133, 'dna_size': 16728945}
                 *
                 */
                
                //assembly_source
                //assembly_source_id
                //assembly_source_date
                container.querySelector('[data-element="numContigs"]').innerHTML = numeral(data["num_contigs"]).format('0,0');
                container.querySelector('[data-element="dnaSize"]').innerHTML = numeral(data["dna_size"]).format('0,0');
                container.querySelector('[data-element="gc"]').innerHTML = numeral(data["gc_content"]).format('0.00%');
                //contig_ids
            }
            
            function renderAnnotation(data) {
                /*
                 *'annotation': {'external_source': 'unknown_source', 'release': 'annotation release is not present', 'external_source_date': '01-APR-2016', 'feature_type_counts': {'misc_feature': 22, 'exon': 5133, 'mRNA': 4998, 'CDS': 4998, 'misc_RNA': 108, 'gene': 5106}, 'original_source_filename': 'Cyanidioschyzon_merolae.ASM9120v1.31.dat'}}
                 *
                 */
                var counts = handlebars.compile("{{#each feature_type_counts}}" +
                                                "<tr><td><b>{{this.[0]}}</b></td><td>{{this.[1]}}</td></tr>" +
                                                "{{/each}}"),
                    formatted_type_counts = [];
                
                Object.keys(data["feature_type_counts"]).sort().forEach(function (k) {
                    formatted_type_counts.push([k, numeral(data["feature_type_counts"][k]).format('0,0')]);
                });
                
                container.querySelector('[data-element="externalSource"]').innerHTML = data["external_source"];
                container.querySelector('[data-element="externalSourceDate"]').innerHTML = data["external_source_date"];
                container.querySelector('[data-element="dataRelease"]').innerHTML = data["release"];
                container.querySelector('[data-element="originalFilename"]').innerHTML = data["original_source_filename"];
                container.querySelector('[data-element="featureTypeCounts"]').innerHTML = counts({feature_type_counts: formatted_type_counts});
                container.querySelector('[data-element="assemblySource"]').innerHTML = data["assembly_source"];
                container.querySelector('[data-element="assemblySourceDate"]').innerHTML = data["assembly_source_date"];
                container.querySelector('[data-element="assemblyID"]').innerHTML = data["assembly_source_id"];
            }
            
            // WIDGET API

            function attach(node) {
                parent = node;
                container = parent.appendChild(document.createElement('div'));
                container.innerHTML = layout();
            }

            function start(params) {
                /* Need to create the GenomeAnnotation client object here because it requires params.
                 * The params is determined by the dataview route, which makes
                 * available:
                 *   workspaceId
                 *   objectId
                 *   objectVersion
                 *   ...
                 */
                var numFeatures = 0;
                
                genomeAnnotation = GenomeAnnotation.client({
                    url: runtime.getConfig('services.genomeAnnotation_api.url'),
                    token: runtime.service('session').getAuthToken(),
                    ref: utils.getRef(params),
                    timeout: 900000
                });
                
                
                Array.from(container.querySelectorAll("[data-element]")).forEach(function (e) {
                    e.innerHTML = html.loading();
                });
                
                
                //container.querySelector("[id='featureTypesPlot']").innerHTML = html.loading();
                
                genomeAnnotation.taxon().then(function(ref) { renderTaxonLink(ref); });
                genomeAnnotation.assembly().then(function(ref) { renderAssemblyLink(ref); });
                
                return genomeAnnotation.summary()
                    .then(function (data) {
                        console.log(data);
                        
                        renderTaxon(data);
                        renderAssembly(data);
                        renderAnnotation(data);
                        
                        /*
                        annotation_data.contig_ids = ids;
                        var ftCounts = {},
                            ftypes = [],
                            fcounts = [],
                            default_ftypes = ['gene','mRNA','CDS'],
                            initial_type = null;
                        
                        for(var f in featureTypes) {
                            if (featureTypes.hasOwnProperty(f)) {
                                ftCounts[f] = numeral(featureTypes[f]).format('0,0');
                                ftypes.push(f);
                                fcounts.push(featureTypes[f]);
                                numFeatures += featureTypes[f];
                            }
                        }
                        
                        renderFeatureTypesPlot(ftypes,fcounts);
                            
                        for (var i in default_ftypes) {
                            if ($.inArray(default_ftypes[i],ftypes) > -1) {
                                initial_type = default_ftypes[i];
                                break;
                            }
                        }
                            
                        if (initial_type === null) {
                            initial_type = ftypes.sort()[0];
                        }
                        
                        filters.type_list.push(initial_type);
                        
                        return genomeAnnotation.feature_ids({
                            filters: {
                                type_list: [initial_type]
                            }
                        })
                        .then(function (feature_ids) {
                            return genomeAnnotation.features(feature_ids.by_type[initial_type].slice(0,1000));
                        })
                        .then(function (feature_data) {
                            renderFeatureDataTable(feature_data);
                        });
                        */
                    })
                    .catch(function (err) {
                       console.log(err); 
                    });
            }

            function stop() {
                // nothing to do
                // typically this is where one would 
            }

            function detach() {
                // nothing to do necessarily, since the parent dom node will
                // be removed the controller for this widget removes it, 
                // but it is nice to take responsibility for undoing what we
                // changed in the parent node:
                if (parent && container) {
                    container.innerHTML = '';
                    parent.removeChild(container);
                }
            }

            return Object.freeze({
                attach: attach,
                start: start,
                stop: stop,
                detach: detach
            });
        }

        return {
            make: function (config) {
                return factory(config);
            }
        };
    });