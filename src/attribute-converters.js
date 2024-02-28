export const commaSeparatedConverter = {
  fromAttribute: (value, type) => {
    return value? value.split(",").filter((x) => x !== "") : [];
  },
  toAttribute: (value, type) => {
    return value.filter((x) => x !== "").join(",");
  },
};
