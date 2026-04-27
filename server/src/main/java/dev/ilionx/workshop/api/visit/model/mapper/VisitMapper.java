package dev.ilionx.workshop.api.visit.model.mapper;

import dev.ilionx.workshop.api.vet.model.Vet;
import dev.ilionx.workshop.api.visit.model.Visit;
import dev.ilionx.workshop.api.visit.model.response.VisitResponse;
import io.github.jframe.util.mapper.config.SharedMapperConfig;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for converting Visit entities to response DTOs.
 */
@Mapper(config = SharedMapperConfig.class)
public abstract class VisitMapper {

    @Mapping(
        source = "pet.id",
        target = "petId"
    )
    @Mapping(
        source = "vet.id",
        target = "vetId"
    )
    @Mapping(
        expression = "java(vetName(visit.getVet()))",
        target = "vetName"
    )
    public abstract VisitResponse toResponse(Visit visit);

    public abstract List<VisitResponse> toResponseList(List<Visit> visits);

    /**
     * Returns the full name of the vet, or null if the vet is null.
     *
     * @param vet the vet entity, may be null
     * @return full name string or null
     */
    protected String vetName(final Vet vet) {
        if (vet == null) {
            return null;
        }
        return vet.getFirstName() + " " + vet.getLastName();
    }
}
