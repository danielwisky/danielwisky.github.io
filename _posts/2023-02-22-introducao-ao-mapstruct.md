---
layout: post
title: "Introdução ao MapStruct"
subtitle: "Aprenda como usar o MapStruct para criar mapeamentos de objetos eficientes e de alta qualidade em seus projetos Java"
tags: [Java, Mapeamento de Objetos, MapStruct]
---

MapStruct é uma biblioteca de mapeamento de objetos Java para Java, que gera automaticamente código de mapeamento para converter objetos de um tipo em outro. Com o MapStruct, você não precisa escrever o código de mapeamento manualmente. Em vez disso, o MapStruct o gera automaticamente a partir das anotações definidas nas classes.

Neste artigo, vamos explorar como instalar e usar o MapStruct com alguns exemplos de mapeamento.

## Instalação do MapStruct

O MapStruct é facilmente instalado adicionando suas dependências ao arquivo `pom.xml` (Maven) ou `build.gradle` (Gradle). Além da biblioteca, é preciso registrar o `mapstruct-processor`, o annotation processor que gera as implementações dos mappers em tempo de compilação.

No Maven, adicione a dependência do MapStruct no bloco `dependencies` e o processor no `maven-compiler-plugin`:

```xml
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.3.Final</version>
</dependency>
```

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <annotationProcessorPaths>
            <path>
                <groupId>org.mapstruct</groupId>
                <artifactId>mapstruct-processor</artifactId>
                <version>1.5.3.Final</version>
            </path>
        </annotationProcessorPaths>
    </configuration>
</plugin>
```

No Gradle, adicione a dependência do MapStruct na seção dependencies:

```groovy
implementation 'org.mapstruct:mapstruct:1.5.3.Final'
annotationProcessor 'org.mapstruct:mapstruct-processor:1.5.3.Final'
```

> **Atualização (2026):** a versão estável mais recente do MapStruct hoje é a 1.6.3. Basta trocar `1.5.3.Final` por `1.6.3` nos exemplos acima.

## Usando MapStruct

Para usar o MapStruct, você precisa criar interfaces de mapeamento anotadas com `@Mapper`. O MapStruct usa as informações fornecidas nas anotações para gerar o código de mapeamento.

Aqui está um exemplo de como criar uma interface de mapeamento:

```java
@Mapper
public interface CarMapper {
    CarDto carToCarDto(Car car);
}
```

Neste exemplo, estamos mapeando um objeto `Car` para um objeto `CarDto`. O MapStruct gera automaticamente o código de mapeamento para essa interface. Para usar o mapeamento, você precisa criar uma instância do mapper e chamar o método de mapeamento.

```java
CarMapper carMapper = Mappers.getMapper(CarMapper.class);
CarDto carDto = carMapper.carToCarDto(car);
```

Neste exemplo, estamos criando uma instância do mapper `CarMapper` e usando o método `carToCarDto` para converter um objeto `Car` em um objeto `CarDto`.

## Mapeamento personalizado

O MapStruct permite que você defina mapeamentos personalizados usando a anotação `@Mapping`. Isso é útil quando o nome da propriedade do objeto de origem não corresponde ao nome da propriedade do objeto de destino.

Aqui está um exemplo de como definir um mapeamento personalizado:

```java
@Mapper
public interface CarMapper {
    @Mapping(source = "numberOfSeats", target = "seatCount")
    CarDto carToCarDto(Car car);
}
```

Neste exemplo, estamos definindo um mapeamento personalizado para a propriedade `numberOfSeats` do objeto `Car`. O valor dessa propriedade será mapeado para a propriedade `seatCount` do objeto `CarDto`.

## Mapeamento reverso

O MapStruct também permite que você defina mapeamentos reversos, que permitem converter objetos de destino em objetos de origem.

Aqui está um exemplo de como definir um mapeamento reverso:

```java
@Mapper
public interface CarMapper {
    @Mapping(source = "numberOfSeats", target = "seatCount")
    CarDto carToCarDto(Car car);

    @InheritInverseConfiguration
    Car carDtoToCar(CarDto carDto);
}
```

Neste exemplo, estamos definindo um mapeamento reverso para converter objetos `CarDto` em objetos `Car`. Usamos a anotação `@InheritInverseConfiguration` para herdar a configuração de mapeamento da função `carToCarDto` de forma invertida: o MapStruct passa a mapear `seatCount` de volta para `numberOfSeats` sem precisarmos repetir o `@Mapping`.

## Mapeamento de coleções

O MapStruct também suporta mapeamento de coleções de objetos: ao declarar um método de lista, ele reutiliza automaticamente o método que mapeia cada elemento. A anotação `@IterableMapping` permite ajustar esse mapeamento, e `@MappingTarget` serve para atualizar um objeto já existente em vez de criar um novo.

Aqui está um exemplo de como definir o mapeamento de uma coleção de objetos:

```java
@Mapper
public interface CarMapper {
    CarDto carToCarDto(Car car);

    @IterableMapping(elementTargetType = CarDto.class)
    List<CarDto> carsToCarDtos(List<Car> cars);

    void updateCarFromDto(CarDto carDto, @MappingTarget Car car);
}
```

Neste exemplo, definimos a função `carsToCarDtos` para mapear uma lista de objetos `Car` em uma lista de objetos `CarDto`. Usamos a anotação `@IterableMapping` para indicar explicitamente o tipo dos elementos de destino como `CarDto`. Aqui ela é opcional, já que o MapStruct encontraria o `carToCarDto` sozinho, mas é útil quando existe mais de um método candidato para os elementos.

Também definimos a função `updateCarFromDto` para atualizar o objeto `Car` a partir de um objeto `CarDto`. Usamos a anotação `@MappingTarget` para especificar que o objeto `Car` é o objeto de destino.

## Conclusão

O MapStruct é uma biblioteca de mapeamento de objetos Java para Java que simplifica o processo de mapeamento de objetos. Com o MapStruct, você pode criar interfaces de mapeamento anotadas e deixar o MapStruct gerar automaticamente o código de mapeamento para você. O MapStruct também suporta mapeamento personalizado, mapeamento reverso e mapeamento de coleções de objetos.

Para começar a usar o MapStruct, basta adicioná-lo como uma dependência em seu projeto e criar interfaces de mapeamento anotadas. Com essas interfaces, você pode converter objetos de um tipo em outro sem escrever o código de mapeamento manualmente.

Fonte:
<a href="https://mapstruct.org/" target="_blank">MapStruct</a>.

Um grande abraço e até o próximo post!
