const cssom = require('cssom');
const fs = require('fs');
const parseCSSColor = require('./css-color-parser').parseCSSColor;
var CssSelectorParser = require('css-selector-parser').CssSelectorParser, cssSelectorParser = new CssSelectorParser();

let classes = {};
let objectTypeStyles = {};

const blendModes = {
    "normal": "LV_BLEND_MODE_NORMAL",
    "additive": "LV_BLEND_MODE_ADDITIVE",
    "subtractive": "LV_BLEND_MODE_SUBTRACTIVE"
};

const alignments = {
    "center": "LV_ALIGN_CENTER",
    "top-left": "LV_ALIGN_IN_TOP_LEFT",
    "top-center": "LV_ALIGN_IN_TOP_MID",
    "top-right": "LV_ALIGN_IN_TOP_RIGHT",
    "bottom-left": "LV_ALIGN_IN_BOTTOM_LEFT",
    "bottom-center": "LV_ALIGN_IN_BOTTOM_MID",
    "bottom-right": "LV_ALIGN_IN_BOTTOM_RIGHT",
    "left-center": "LV_ALIGN_IN_LEFT_MID",
    "right-center": "LV_ALIGN_IN_RIGHT_MID",
    "out-top-left": "LV_ALIGN_OUT_TOP_LEFT",
    "out-top-center": "LV_ALIGN_OUT_TOP_MID",
    "out-top-right": "LV_ALIGN_OUT_TOP_RIGHT",
    "out-bottom-left": "LV_ALIGN_OUT_BOTTOM_LEFT",
    "out-bottom-center": "LV_ALIGN_OUT_BOTTOM_MID",
    "out-bottom-right": "LV_ALIGN_OUT_BOTTOM_RIGHT",
    "out-left-top": "LV_ALIGN_OUT_LEFT_TOP",
    "out-left-center": "LV_ALIGN_OUT_LEFT_MID",
    "out-left-bottom": "LV_ALIGN_OUT_LEFT_BOTTOM",
    "out-right-top": "LV_ALIGN_OUT_RIGHT_TOP",
    "out-right-center": "LV_ALIGN_OUT_RIGHT_MID",
    "out-right-bottom": "LV_ALIGN_OUT_RIGHT_BOTTOM"
};
const textDecors = {
    "none": "LV_TEXT_DECOR_NONE",
    "underline": "LV_TEXT_DECOR_UNDERLINE",
    "strikethrough": "LV_TEXT_DECOR_STRIKETHROUGH"
};

let convertable_properties = {
    "background-color": {
        lv_name: "BG_COLOR",
        type: "color",
        alpha: "bg_opa"
    },
    "border-radius": {
        lv_name: "RADIUS",
        type: "int"
    },
    "clip-corner": {
        lv_name: "CLIP_CORNER",
        type: "bool"
    },
    "transform-x": {
        lv_name: "TRANSFORM_WIDTH",
        type: "int"
    },
    "transform-y": {
        lv_name: "TRANSFORM_HEIGHT",
        type: "int",
    },
    "transform-angle": {
        lv_name: "TRANSFORM_ANGLE",
        type: "int"
    },
    "opacity": {
        lv_name: "OPA_SCALE",
        type: "percent"
    },
    "padding-left": {
        lv_name: "PAD_LEFT",
        type: "number"
    },
    "padding-top": {
        lv_name: "PAD_TOP",
        type: "number"
    },
    "padding-right": {
        lv_name: "PAD_RIGHT",
        type: "number"
    },
    "padding-bottom": {
        lv_name: "PAD_BOTTOM",
        type: "number"
    },
    "padding-inner": {
        lv_name: "PAD_INNER",
        type: "number"
    },
    "margin-left": {
        lv_name: "MARGIN_LEFT",
        type: "number"
    },
    "margin-top": {
        lv_name: "MARGIN_TOP",
        type: "number"
    },
    "margin-right": {
        lv_name: "MARGIN_RIGHT",
        type: "number"
    },
    "margin-bottom": {
        lv_name: "MARGIN_BOTTOM",
        type: "number"
    },
    "background-blend-mode": {
        lv_name: "BG_BLEND_MODE",
        type: "enum_single",
        enumValues: blendModes
    },
    "border-width": {
        type: "int"
    },
    "border-side": {
        type: "enum_list",
        enumValues: {
            "top": "LV_BORDER_SIDE_TOP",
            "left": "LV_BORDER_SIDE_LEFT",
            "bottom": "LV_BORDER_SIDE_BOTTOM",
            "right": "LV_BORDER_SIDE_RIGHT",
            "internal": "LV_BORDER_SIDE_INTERNAL",
            "full": "LV_BORDER_SIDE_FULL",
            "all": "LV_BORDER_SIDE_FULL",
        }
    },
    "border-blend-mode": {
        lv_name: "BORDER_BLEND_MODE",
        type: "enum_single",
        enumValues: blendModes
    },
    "border-color": {
        type: "color",
        alpha: "border_opa"
    },
    "outline-width": {
        type: "int"
    },
    "outline-blend-mode": {
        lv_name: "OUTLINE_BLEND_MODE",
        type: "enum_single",
        enumValues: blendModes
    },
    "outline-color": {
        type: "color",
        alpha: "outline_opa"
    },
    "outline-padding": {
        type: "int",
        lv_name: "OUTLINE_PAD"
    },
    "shadow-color": {
        type: "color",
        alpha: "shadow_opa"
    },
    "shadow-width": {
        type: "int"
    },
    "shadow-spread": {
        type: "int"
    },
    "shadow-blend-mode": {
        lv_name: "SHADOW_BLEND_MODE",
        type: "enum_single",
        enumValues: blendModes
    },
    "shadow-offset-x": {
        type: "int",
        lv_name: "SHADOW_OFS_X"
    },
    "shadow-offset-y": {
        type: "int",
        lv_name: "SHADOW_OFS_Y"
    },
    "pattern-image": {
        type: "address"
    },
    "pattern-color": {
        type: "color",
        lv_name: "PATTERN_RECOLOR",
        alpha: "pattern_recolor_opa"
    },
    "pattern-repeat": {
        type: "bool"
    },
    "pattern-blend-mode": {
        lv_name: "PATTERN_BLEND_MODE",
        type: "enum_single",
        enumValues: blendModes
    },
    "value-str": {
        type: "string",
    },
    "value-color": {
        type: "color",
        lv_name: "VALUE_COLOR",
        alpha: "value_opa"
    },
    "value-font": {
        type: "address"
    },
    "value-align": {
        type: "enum_single",
        enumValues: alignments
    },
    "value-offset-x": {
        type: "int",
        lv_name: "VALUE_OFS_X"
    },
    "value-offset-y": {
        type: "int",
        lv_name: "VALUE_OFS_Y"
    },
    "value-blend-mode": {
        lv_name: "VALUE_BLEND_MODE",
        type: "enum_single",
        enumValues: blendModes
    },
    "value-letter-space": {
        type: "int"
    },
    "value-line-space": {
        type: "int"
    },
    "text-color": {
        type: "color",
        lv_name: "TEXT_COLOR",
        alpha: "text_opa"
    },
    "text-font": {
        type: "address"
    },
    "text-blend-mode": {
        lv_name: "TEXT_BLEND_MODE",
        type: "enum_single",
        enumValues: blendModes
    },
    "text-letter-space": {
        type: "int"
    },
    "text-line-space": {
        type: "int"
    },
    "text-decor": {
        type: "enum_list",
        enumValues: textDecors
    },
    "line-width": {
        type: "int"
    },
    "line-blend-mode": {
        lv_name: "LINE_BLEND_MODE",
        type: "enum_single",
        enumValues: blendModes
    },
    "line-color": {
        type: "color",
        alpha: "line_opa"
    },
    "line-dash-width": {
        type: "int"
    },
    "line-dash-gap": {
        type: "int"
    },
    "line-rounded": {
        type: "bool"
    },
    "image-color": {
        type: "color",
        alpha: "image_recolor_opa",
        lv_name: "IMAGE_RECOLOR"
    },
    "image-blend-mode": {
        lv_name: "IMAGE_BLEND_MODE",
        type: "enum_single",
        enumValues: blendModes
    },
    "image-opacity": {
        type: "percent"
    },
    "scale-grad-color": {
        type: "color"
    },
    "scale-end-color": {
        type: "color"
    },
    "scale-border-width": {
        type: "int"
    },
    "scale-end-border-width": {
        type: "int"
    },
    "scale-end-line-width": {
        type: "int"
    },
    "font-family": {
        alias: "text-font"
    },
    "border": {
        type: "group",
        groupElements: [
            "border-width",
            "border-color"
        ]
    }
}

function getRealPropertyName(propertyName) {
    while(true) {
        if(convertable_properties[propertyName] == undefined) {
            throw new Error("Unknown LVGL CSS property: " + propertyName);
        }
        if(convertable_properties[propertyName].alias != undefined) {
            propertyName = convertable_properties[propertyName].alias;
            continue;
        }
        return propertyName;
    }
}

function getLvName(propertyName) {
    const convertPropertyObj = convertable_properties[propertyName];
    if(typeof convertPropertyObj.lv_name != 'undefined')
        return convertPropertyObj.lv_name;
    return propertyName.toUpperCase().replace(/-/g, "_");
}
function validateState(state) {
    var validStates = [
        "DEFAULT",
        "CHECKED",
        "FOCUSED",
        "EDITED",
        "HOVERED",
        "PRESSED",
        "DISABLED"
    ];
    return validStates.includes(state.toUpperCase());
}

function micropythonState(state) {
    return "lv." + state.substr(3).toUpperCase().replace(/_/g, '.');
}

function get_lv_c_value(propertyName, value, type, className, state, lang) {
    if(typeof convertable_properties[propertyName] == 'undefined')
        throw new Error("Unknown property");
    var valueType = convertable_properties[propertyName].type;
    if(valueType == "color") {
        let rgba = parseCSSColor(value);
        let color_make;
        if(lang == "c")
            color_make = "LV_COLOR_MAKE";
        else if(lang == "micropython")
            color_make = "lv.color_make";
        else
            throw new Error("Unknown language: " + lang);
        var color = `${color_make}(${rgba[0]}, ${rgba[1]}, ${rgba[2]})`;
        if(typeof convertable_properties[propertyName].alpha != 'undefined') {
            if(lang == "c")
                color += `); lv_style_set_${convertable_properties[propertyName].alpha}(&lv_style_${type == "tag" ? "css_wid_" : ""}${className}, ${state.toUpperCase()}, ${Math.round(rgba[3] * 255)}`;
            else if(lang == "micropython")
                color += `)\nstyle_${type == "tag" ? "css_wid_" : ""}${className}.set_${convertable_properties[propertyName].alpha}(${micropythonState(state)}, ${Math.round(rgba[3] * 255)}`;
        }
        return color;
    } else if(valueType == "number" || valueType == "int") {
        var n = parseInt(value);
        if(isNaN(n))
            throw new Error("Not a number");
        return n;
    } else if(valueType == "percent") {
        var n = parseFloat(value);
        if(isNaN(n))
            throw new Error("Not a percent or number");
        if(value.endsWith("%"))
            n /= 100;
        if(n < 0 || n > 1)
            throw new Error("Not a number between 0 and 1");
        return Math.round(n * 255);
    } else if(valueType == "bool") {
        if(value == "true" || value == "yes")
            return true;
        else if(value == "false" || value == "no")
            return false;
        throw new Error("Not a boolean value");
    } else if(valueType == "enum_single") {
        if(!Object.keys(convertable_properties[propertyName].enumValues).includes(value)) {
            throw new Error(`'${value}': not a valid value`);
        }
        return convertable_properties[propertyName].enumValues[value];
    } else if(valueType == "enum_list") {
        const value_list = value.split(',');
        let finalValue = "";
        for(let value of value_list) {
            value = value.trim();
            if(!Object.keys(convertable_properties[propertyName].enumValues).includes(value)) {
                throw new Error(`'${value}': not a valid value`);
            }
            finalValue += `|${convertable_properties[propertyName].enumValues[value]}`;
        }
        return finalValue.substr(1);
    } else if(valueType == "address") {
        return "&" + value;
    } else
        throw new Error("Unable to handle value type '" + valueType + "'");
}
function flattenStates(states) {
    return states.map(state => `LV_STATE_${state.toUpperCase()}`).join(" | ");
}
function processProperty(propertyName, realValue, type, name, states, part, lang) {
    let styleObj = null;
    if(type == "class") {
        styleObj = classes[name] || {};
        classes[name] = styleObj;
    } else if(type == "tag") {
        name = name + "_part_" + part;
        styleObj = objectTypeStyles[name] || {};
        objectTypeStyles[name] = styleObj;
    } else
        throw new Error("Unexpected selector type");
    propertyName = getRealPropertyName(propertyName);
    if(convertable_properties[propertyName].type == "group") {
        /* Groups must be broken down into individual properties */
        const groupStack = Array.from(convertable_properties[propertyName].groupElements).reverse();
        const values = realValue.split(" ").reverse();
        while(groupStack.length > 0) {
            var value = values.pop();
            do {
                try {
                    var pn = groupStack.pop();
                    processProperty(pn, value, type, name, states, part, lang);
                    break;
                } catch(e) {
                    console.error(e);
                }
            } while(groupStack.length > 0);
        }
        return;
    }

    const lv_name = getLvName(propertyName);
    const valueObj = styleObj[convertable_properties[propertyName]] || {};
    styleObj[lv_name] = valueObj;
    var state = flattenStates(states);
    try {
        styleObj[lv_name][state] = get_lv_c_value(propertyName, realValue, type, name, state, lang);
    } catch(e) {
        console.error(`Error while parsing property '${propertyName}': ` + e);
        throw new Error();
    }
}
/**
 * Converts a style sheet to a set of LittlevGL style rules.
 * @param {String} css_string CSS stylesheet to convert
 */
function convert(watcher, css_string, lang) {
    const csso = cssom.parse(css_string);
    for(const rule of csso.cssRules) {
        if(rule instanceof cssom.CSSStyleRule) {
            var parsedObj = cssSelectorParser.parse(rule.selectorText);
            if(typeof parsedObj.selectors == 'undefined')
                parsedObj = { selectors: [ parsedObj ]};
            for(const selector of parsedObj.selectors) {
                let name = null;
                let hasTagName = typeof selector.rule.tagName != 'undefined';
                let hasClassName = typeof selector.rule.classNames != 'undefined';
                if(hasTagName && hasClassName)
                    throw new Error("Selectors must only have a tag or class name, not both.");
                else if(hasTagName)
                    name = selector.rule.tagName;
                else if(hasClassName)
                    name = selector.rule.classNames[0];
                else
                    throw new Error("Unexpected selector type");
                let part = "main";
                let states = [ "default" ];
                if(selector.rule.pseudos) {
                    for(var i = 0; i < selector.rule.pseudos.length; i++) {
                        var state = selector.rule.pseudos[i].name;
                        if(state.trim().length == 0)
                            continue;
                        if(validateState(state)) {
                            states.push(state);
                        } else if(part == "main")
                            part = state;
                        else
                            throw new Error("Unexpected state/part: " + state);
                    }
                    
                }
                if(part != "main" && !hasTagName)
                    throw new Error("Parts can only be specified when using a tag selector (i.e. btn) not a class selector");
     
                for(var i = 0; i < rule.style.length; i++) {
                    processProperty(rule.style[i], rule.style[rule.style[i]], hasClassName ? "class" : "tag", name, states, part, lang);
                }
            }
            
        } else if(rule instanceof cssom.CSSImportRule) {
            fs.accessSync(rule.href, fs.constants.R_OK);
            if(watcher != null)
                watcher.add(rule.href);
            convert(watcher, fs.readFileSync(rule.href).toString(), lang);
        }
    }
}

function langComment(lang, comment) {
    if(lang == "c")
        return `/* ${comment} */\n`;
    else if(lang == "micropython")
        return `# ${comment}\n`;
    else
        throw new Error("Unknown language");
}

function styleGen(lang, lineEnding, obj) {
    var file = "";
    for(var cls in obj) {
        var clsTerm = cls;
        if(obj == classes)
            file += "\n" + langComment(lang, `.${cls}`);
        else {
            file += "\n" + langComment(lang, cls);
            clsTerm = "css_wid_" + cls;
        }
        if(lang == "c")
            file += `    lv_style_init(&lv_style_${clsTerm});\n`;
        else if(lang == "micropython")
            file += `style_${clsTerm} = lv.style_t()\n`;
        Object.keys(obj[cls]).forEach((key) => {
            const valueObj = obj[cls][key];
            Object.keys(valueObj).forEach(state => {
                if(lang == "micropython")
                    file += `style_${clsTerm}.set_${key.toLowerCase()}(${micropythonState(state)}, ${valueObj[state]})${lineEnding}\n`;
                else if(lang == "c")
                    file += `    lv_style_set_${key.toLowerCase()}(&lv_style_${clsTerm}, ${state.toUpperCase()}, ${valueObj[state]})${lineEnding}\n`;
            });
            
        });
    }
    return file;
}

/**
 * Write a code file containing the styles.
 * 
 */
function finalize(lang) {
    var file = "";
    var lineEnding = "";
    if(lang == "c")
        lineEnding = ";";
    
    file += langComment(lang, "Autogenerated file; do not edit.");
    if(lang == "c") {
        file += "#include <lvgl/lvgl.h>\n\n";
    } else if(lang == "micropython") {
        file += "import lvgl as lv\n\n";
    }

    file += "\n\n";
    file += "# Initialize a custom theme*/\n";
    file += `class style_css_theme(lv.theme_t):
    def __init__(self):
        super().__init__()

        # This theme is based on active theme
        base_theme = lv.theme_get_act()
        self.copy(base_theme)

        # This theme will be applied only after base theme is applied
        self.set_base(base_theme)

        # Set the "apply" callback of this theme to our custom callback
        self.set_apply_cb(self.apply)

        # Activate this theme
        self.set_act()
    
    def apply(self, theme, obj, name):
        style_css_apply_cb(theme, obj, name)\n\ntheme = style_css_theme()\n`;
    
    file += styleGen(lang, lineEnding, classes);
    file += styleGen(lang, lineEnding, objectTypeStyles);

    if(lang == "c")
        file += "}\n";

    if(lang == "c")
        file += "\nstatic void lv_style_css_apply_cb(lv_theme_t * th, lv_obj_t * obj, lv_theme_style_t name) {\n";
    else if(lang == "micropython")
        file += "\ndef style_css_apply_cb(th, obj, name):\n";
    if(lang == "c") {
        file += "    lv_style_list_t * list;\n\n";
        file += "    switch(name) {\n";
    }

    var widgetParts = {};
    var widgetNames = new Set(Object.keys(objectTypeStyles).map(wid => {
        var words = wid.split("_part_");
        var widgetName = words[0];
        var widgetPartObj = widgetParts[widgetName] || [];
        widgetParts[widgetName] = widgetPartObj;
        widgetPartObj.push(words[1]);
        return widgetName;
    }));
    widgetNames.forEach(wid => {
        if(lang == "c")
            file += `        case LV_THEME_${wid.toUpperCase()}:\n`;
        else if(lang == "micropython")
            file += `    if name == lv.THEME.${wid.toUpperCase()}:\n`;
        widgetParts[wid].forEach(part => {
            if(lang == "c") {
                file += `            list = lv_obj_get_style_list(obj, LV_${wid.toUpperCase()}_PART_${part.toUpperCase()});\n`;
                file += `            _lv_style_list_add_style(list, &lv_style_css_wid_${wid}_part_${part});\n`;
                file += `            break;\n`;
            } else if(lang == "micropython")
                file += `       obj.add_style(lv.${wid}.PART.${part.toUpperCase()}, style_css_wid_${wid}_part_${part})\n`;
        });
    });
    if(lang == "c") {
        file += `        default:\n`;
        file += `            break;\n`;
        file += "    }\n";
        file += "}\n";
    }
    
    return file;
}
module.exports = { convert: convert, finalize: finalize };