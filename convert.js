const cssom = require('cssom');
const parseCSSColor = require('./css-color-parser').parseCSSColor;
var CssSelectorParser = require('css-selector-parser').CssSelectorParser, cssSelectorParser = new CssSelectorParser();

let classes = {};

const blendModes = {
    "normal": "LV_BLEND_MODE_NORMAL",
    "additive": "LV_BLEND_MODE_ADDITIVE",
    "subtractive": "LV_BLEND_MODE_SUBTRACTIVE"
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
        lv_name: "BG_BLEND_MODE",
        type: "enum_single",
        enumValues: blendModes
    },
    "border-color": {
        type: "color",
        alpha: "border_opa"
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
    if(!validStates.includes(state.toUpperCase()))
        throw new Error("Unknown state");
}

function get_lv_c_value(propertyName, value, className, state) {
    if(typeof convertable_properties[propertyName] == 'undefined')
        throw new Error("Unknown property");
    var valueType = convertable_properties[propertyName].type;
    if(valueType == "color") {
        let rgba = parseCSSColor(value);
        var color = `LV_COLOR_MAKE(${rgba[0]}, ${rgba[1]}, ${rgba[2]})`;
        if(typeof convertable_properties[propertyName].alpha != 'undefined') {
            color += `); lv_style_set_${convertable_properties[propertyName].alpha}(&lv_style_${className}, LV_STATE_${state.toUpperCase()}, ${Math.round(rgba[3] * 255)}`;
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
    } else
        throw new Error("Unable to handle value type '" + valueType + "'");
}
/**
 * Converts a style sheet to a set of LittlevGL style rules.
 * @param {CSSOM.CSSStyleSheet} csso stylesheet to convert
 */
function convert(csso) {
    for(const rule of csso.cssRules) {
        if(rule instanceof cssom.CSSStyleRule) {
            var parsedObj = cssSelectorParser.parse(rule.selectorText);
            if(typeof parsedObj.selectors == 'undefined')
                parsedObj = { selectors: [ parsedObj ]};
            for(const selector of parsedObj.selectors) {
                console.log(selector.rule);
                const className = selector.rule.classNames[0];
                let state = "normal";
                if(selector.rule.pseudos) {
                    state = selector.rule.pseudos[0].name;
                    validateState(state);
                }
                
                const classObj = classes[className] || {};
                classes[className] = classObj;
                for(var i = 0; i < rule.style.length; i++) {
                    var propertyName = rule.style[i];
                    if(convertable_properties[propertyName] == undefined) {
                        throw new Error("Unknown LVGL CSS property: " + propertyName);
                    }
                    const lv_name = getLvName(propertyName);
                    const valueObj = classObj[convertable_properties[propertyName]] || {};
                    classObj[lv_name] = valueObj;
                    try {
                        classObj[lv_name][state] = get_lv_c_value(propertyName, rule.style[propertyName], className, state);
                    } catch(e) {
                        console.error(`Error while parsing property '${propertyName}': ` + e);
                        throw new Error();
                    }
                }
            }
            
        }
    }
}

/**
 * Write a C file containing the styles.
 * 
 */
function finalize() {
    var file = "";
    file += "/*\n * Autogenerated file; do not edit.\n */\n\n";
    Object.keys(classes).forEach(cls => {
        file += `lv_style_t lv_style_${cls};\n`;
    });

    file += "\nvoid lv_style_css_init(void) {\n";
    for(var cls in classes) {
        file += `    lv_style_init(&lv_style_${cls});\n`;
        Object.keys(classes[cls]).forEach((key) => {
            const valueObj = classes[cls][key];
            Object.keys(valueObj).forEach(state => {
                file += `    lv_style_set_${key.toLowerCase()}(&lv_style_${cls}, LV_STATE_${state.toUpperCase()}, ${valueObj[state]});\n`;
            });
            
        });
    }
    file += "}\n";
    console.log(file);
    return file;
}
module.exports = { convert: convert, finalize: finalize };