// SPDX-License-Identifier: Apache-2.0
// engine_guardrail_test.cpp - C++20 Guardrail & Architect Verification Entrypoint

#include "VoxelRealmsGuardrails.hpp"

int main() {
    using voxel::guardrails::computeCacheLineBytesForIsa;
    using voxel::guardrails::computeCascadedUniverseQiMultiplier;
    using voxel::guardrails::computeCosmicLayerScaleMultiplier;
    using voxel::guardrails::computeRealmSuppressionMultiplier;
    using voxel::guardrails::CosmicOntologyLayer;
    using voxel::guardrails::CultivationRealm;
    using voxel::guardrails::CultivatorNode;
    using voxel::guardrails::HardwareIsaTier;
    using voxel::guardrails::SectHierarchyManager;
    using voxel::guardrails::SoaEntityKinematicChunk;
    using voxel::guardrails::WhitePageRootSpec;

    constexpr double suppression = computeRealmSuppressionMultiplier(
        CultivationRealm::GoldenCore, CultivationRealm::QiRefinement);
    constexpr uint64_t whitePageScale =
        computeCosmicLayerScaleMultiplier(CosmicOntologyLayer::TheWhitePage_HouseOfIdeas);
    constexpr WhitePageRootSpec rootSpec{};
    static_assert(suppression > 99.9);
    static_assert(whitePageScale == 100000ULL);
    static_assert(rootSpec.includesOblivion && rootSpec.tier4OmniverseCount == 100U);
    static_assert(computeCascadedUniverseQiMultiplier(5.0, 4.0) == 20.0);
    static_assert(computeCacheLineBytesForIsa(HardwareIsaTier::AppleSilicon_UMA128) == 128U);
    static_assert(alignof(SoaEntityKinematicChunk) == 64U);

    auto chunk = std::make_unique<SoaEntityKinematicChunk>();
    chunk->posX[0] = 12.5F;
    chunk->velX[0] = 1.25F;

    SectHierarchyManager sect;
    const auto masterRealm = CultivationRealm::GoldenCore;
    auto master = std::make_shared<CultivatorNode>("Daoist Sovereign", masterRealm, 250);
    sect.registerMaster(master);
    sect.enrollDisciple("Outer Disciple Lin", CultivationRealm::QiRefinement);
    sect.enrollDisciple("Inner Disciple Mei", CultivationRealm::FoundationEstablishment);

    if (suppression < 99.9 || !sect.hasActiveMaster() || sect.getDiscipleCount() != 2U ||
        chunk->posX[0] < 12.0F) {
        return 1;
    }
    return 0;
}
