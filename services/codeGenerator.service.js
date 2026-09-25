class CodeGeneratorService {

    generate(prefix, id) {

        return `${prefix}-${id}`;

    }

}

module.exports = new CodeGeneratorService();